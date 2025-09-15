import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserCommand } from './commands/create-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { User } from './domain/user.model';
import { GetUsersQueryDto } from './dtos/get-users.query.dto';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    ) { }

    async create(cmd: CreateUserCommand): Promise<User> {
        const exists = await this.userRepository.exists({ where: { email: cmd.email } });
        if (exists) throw new ConflictException('Email already in use');

        const passwordHash = await crypto.hash(cmd.rawPassword, 12);

        const userEntity = this.userRepository.create({
            name: cmd.name,
            email: cmd.email,
            passwordHash,
            role: cmd.role,
        });

        const savedUser = await this.userRepository.save(userEntity);
        return UserMapper.toDomain(savedUser);
    }

    async findAll(query: GetUsersQueryDto = {}): Promise<{ users: User[]; total: number }> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        // Apply role filter
        if (query.role) {
            queryBuilder.andWhere('user.role = :role', { role: query.role });
        }

        // Apply search filter (name or email) - SQLite compatible
        if (query.search) {
            queryBuilder.andWhere(
                '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
                { search: `%${query.search}%` }
            );
        }

        // Apply ordering
        const orderBy = query.orderBy || 'createdAt';
        const order = query.order || 'DESC';
        queryBuilder.orderBy(`user.${orderBy}`, order);

        // Apply pagination
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        queryBuilder.skip(skip).take(limit);

        const [users, total] = await queryBuilder.getManyAndCount();
        return {
            users: UserMapper.toDomainList(users),
            total,
        };
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        return UserMapper.toDomain(user);
    }

    async update(cmd: UpdateUserCommand): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: cmd.id } });
        if (!user) throw new NotFoundException('User not found');

        // Check if email is being updated and if it already exists
        if (cmd.email && cmd.email !== user.email) {
            const emailExists = await this.userRepository.exists({ where: { email: cmd.email } });
            if (emailExists) throw new ConflictException('Email already in use');
        }

        // Update fields if provided
        if (cmd.name !== undefined) user.name = cmd.name;
        if (cmd.email !== undefined) user.email = cmd.email;
        if (cmd.role !== undefined) user.role = cmd.role;
        if (cmd.rawPassword !== undefined) {
            user.passwordHash = await crypto.hash(cmd.rawPassword, 12);
        }

        const updatedUser = await this.userRepository.save(user);
        return UserMapper.toDomain(updatedUser);
    }

    async remove(id: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        await this.userRepository.remove(user);
    }
}