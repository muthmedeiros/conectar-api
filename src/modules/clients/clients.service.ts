import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/domain/user.model';
import { UserEntity } from '../users/entities/user.entity';
import { CreateClientCommand } from './commands/create-client.command';
import { UpdateClientCommand } from './commands/update-client.command';
import { Client } from './domain/client.model';
import { GetClientsQueryDto } from './dtos/get-clients.query.dto';
import { ClientEntity } from './entities/client.entity';
import { ClientMapper } from './mappers/client.mapper';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(ClientEntity) private readonly clientRepository: Repository<ClientEntity>,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    ) { }

    async create(cmd: CreateClientCommand): Promise<Client> {
        // Verify CNPJ uniqueness
        const cnpjExists = await this.clientRepository.exists({ where: { cnpj: cmd.cnpj } });
        if (cnpjExists) throw new ConflictException('CNPJ already in use');

        // Verify admin user exists and is admin
        const adminUser = await this.userRepository.findOne({ where: { id: cmd.adminUserId } });
        if (!adminUser) throw new NotFoundException('Admin user not found');
        if (adminUser.role !== UserRole.ADMIN) {
            throw new ConflictException('Admin user must have admin role');
        }

        const clientEntity = this.clientRepository.create({
            corporateReason: cmd.corporateReason,
            cnpj: cmd.cnpj,
            name: cmd.name,
            status: cmd.status,
            conectarPlus: cmd.conectarPlus || false,
            adminUserId: cmd.adminUserId,
        });

        const savedClient = await this.clientRepository.save(clientEntity);
        return ClientMapper.toDomain(savedClient);
    }

    async findAll(query: GetClientsQueryDto = {}, currentUser: User): Promise<{ clients: Client[]; total: number }> {
        const queryBuilder = this.clientRepository
            .createQueryBuilder('client')
            .leftJoinAndSelect('client.adminUser', 'adminUser')
            .leftJoinAndSelect('client.users', 'users');

        // Role-based filtering
        if (currentUser.role !== UserRole.ADMIN) {
            // Regular users can only see clients they are related to
            queryBuilder.andWhere(
                '(client.adminUserId = :userId OR users.id = :userId)',
                { userId: currentUser.id }
            );
        }

        // Apply search filter (name or CNPJ)
        if (query.search) {
            queryBuilder.andWhere(
                '(LOWER(client.name) LIKE LOWER(:search) OR LOWER(client.cnpj) LIKE LOWER(:search))',
                { search: `%${query.search}%` }
            );
        }

        // Apply status filter
        if (query.status) {
            queryBuilder.andWhere('client.status = :status', { status: query.status });
        }

        // Apply conectarPlus filter
        if (query.conectarPlus !== undefined) {
            queryBuilder.andWhere('client.conectarPlus = :conectarPlus', { conectarPlus: query.conectarPlus });
        }

        // Apply ordering
        const orderBy = query.orderBy || 'createdAt';
        const order = query.order || 'DESC';
        queryBuilder.orderBy(`client.${orderBy}`, order);

        // Apply pagination
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);

        const [clients, total] = await queryBuilder.getManyAndCount();
        return {
            clients: ClientMapper.toDomainList(clients),
            total,
        };
    }

    async findOne(id: string, currentUser: User): Promise<Client> {
        const queryBuilder = this.clientRepository
            .createQueryBuilder('client')
            .leftJoinAndSelect('client.adminUser', 'adminUser')
            .leftJoinAndSelect('client.users', 'users')
            .where('client.id = :id', { id });

        // Role-based filtering for single client access
        if (currentUser.role !== UserRole.ADMIN) {
            queryBuilder.andWhere(
                '(client.adminUserId = :userId OR users.id = :userId)',
                { userId: currentUser.id }
            );
        }

        const client = await queryBuilder.getOne();
        if (!client) throw new NotFoundException('Client not found');

        return ClientMapper.toDomain(client);
    }

    async update(cmd: UpdateClientCommand, currentUser: User): Promise<Client> {
        const client = await this.clientRepository
            .createQueryBuilder('client')
            .leftJoinAndSelect('client.adminUser', 'adminUser')
            .leftJoinAndSelect('client.users', 'users')
            .where('client.id = :id', { id: cmd.id })
            .getOne();

        if (!client) throw new NotFoundException('Client not found');

        // Role-based authorization for updates
        if (currentUser.role !== UserRole.ADMIN) {
            // Regular users can only update clients they are related to
            const isRelated = client.adminUserId === currentUser.id ||
                client.users?.some(user => user.id === currentUser.id);
            if (!isRelated) {
                throw new ForbiddenException('You can only update clients you are related to');
            }
        }

        // Check if CNPJ is being updated and if it already exists
        if (cmd.cnpj && cmd.cnpj !== client.cnpj) {
            const cnpjExists = await this.clientRepository.exists({ where: { cnpj: cmd.cnpj } });
            if (cnpjExists) throw new ConflictException('CNPJ already in use');
        }

        // Update fields if provided
        if (cmd.corporateReason !== undefined) client.corporateReason = cmd.corporateReason;
        if (cmd.cnpj !== undefined) client.cnpj = cmd.cnpj;
        if (cmd.name !== undefined) client.name = cmd.name;
        if (cmd.status !== undefined) client.status = cmd.status;
        if (cmd.conectarPlus !== undefined) client.conectarPlus = cmd.conectarPlus;

        const updatedClient = await this.clientRepository.save(client);
        return ClientMapper.toDomain(updatedClient);
    }

    async remove(id: string): Promise<void> {
        const client = await this.clientRepository.findOne({ where: { id } });
        if (!client) throw new NotFoundException('Client not found');

        await this.clientRepository.remove(client);
    }

    async addUserToClient(clientId: string, userId: string): Promise<void> {
        const client = await this.clientRepository.findOne({
            where: { id: clientId },
            relations: ['users']
        });
        if (!client) throw new NotFoundException('Client not found');

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Check if user is already added to client
        const isAlreadyAdded = client.users?.some(u => u.id === userId);
        if (isAlreadyAdded) {
            throw new ConflictException('User is already associated with this client');
        }

        if (!client.users) client.users = [];
        client.users.push(user);

        await this.clientRepository.save(client);
    }

    async removeUserFromClient(clientId: string, userId: string): Promise<void> {
        const client = await this.clientRepository.findOne({
            where: { id: clientId },
            relations: ['users']
        });
        if (!client) throw new NotFoundException('Client not found');

        // Prevent removing admin user from client
        if (client.adminUserId === userId) {
            throw new ConflictException('Cannot remove admin user from client');
        }

        if (client.users) {
            client.users = client.users.filter(user => user.id !== userId);
            await this.clientRepository.save(client);
        }
    }
}