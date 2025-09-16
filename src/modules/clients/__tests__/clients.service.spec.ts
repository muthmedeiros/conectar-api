import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../users/domain/user.model';
import { UserEntity } from '../../users/entities/user.entity';
import { ClientsService } from '../clients.service';
import { CreateClientCommand } from '../commands/create-client.command';
import { ClientEntity } from '../entities/client.entity';
import { ClientStatus } from '../enums/client-status.enum';

describe('ClientsService', () => {
    let service: ClientsService;
    let clientRepository: Repository<ClientEntity>;
    let userRepository: Repository<UserEntity>;

    const mockClientRepository = {
        exists: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
    };

    const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        getOne: jest.fn(),
    };

    const mockAdminUser: User = {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRegularUser: User = {
        id: 'user-id',
        name: 'Regular User',
        email: 'user@test.com',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientsService,
                {
                    provide: getRepositoryToken(ClientEntity),
                    useValue: mockClientRepository,
                },
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        service = module.get<ClientsService>(ClientsService);
        clientRepository = module.get<Repository<ClientEntity>>(getRepositoryToken(ClientEntity));
        userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

        jest.clearAllMocks();
        mockClientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should throw ConflictException when CNPJ already exists', async () => {
            const command: CreateClientCommand = {
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                adminUserId: 'admin-id',
            };

            mockClientRepository.exists.mockResolvedValue(true);

            await expect(service.create(command)).rejects.toThrow(ConflictException);
        });

        it('should throw NotFoundException when admin user does not exist', async () => {
            const command: CreateClientCommand = {
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                adminUserId: 'non-existent-admin',
            };

            mockClientRepository.exists.mockResolvedValue(false);
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.create(command)).rejects.toThrow(NotFoundException);
        });

        it('should create client successfully when all conditions are met', async () => {
            const command: CreateClientCommand = {
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                adminUserId: 'admin-id',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
            };

            const mockAdminUserEntity: UserEntity = {
                id: 'admin-id',
                name: 'Admin User',
                email: 'admin@test.com',
                role: UserRole.ADMIN,
                passwordHash: 'hash',
                clients: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockClientEntity: ClientEntity = {
                id: 'client-id',
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: 'admin-id',
                adminUser: mockAdminUserEntity,
                users: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockClientRepository.exists.mockResolvedValue(false);
            mockUserRepository.findOne.mockResolvedValue(mockAdminUserEntity);
            mockClientRepository.create.mockReturnValue(mockClientEntity);
            mockClientRepository.save.mockResolvedValue(mockClientEntity);

            const result = await service.create(command);

            expect(result).toBeDefined();
            expect(result.corporateReason).toBe(command.corporateReason);
            expect(result.cnpj).toBe(command.cnpj);
            expect(result.name).toBe(command.name);
        });
    });

    describe('remove', () => {
        it('should throw NotFoundException when client does not exist', async () => {
            mockClientRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
        });

        it('should delete client successfully when client exists', async () => {
            const mockClientEntity: Partial<ClientEntity> = {
                id: 'client-id',
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: 'admin-id',
                users: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockClientRepository.findOne.mockResolvedValue(mockClientEntity);
            mockClientRepository.remove.mockResolvedValue(undefined);

            await expect(service.remove('client-id')).resolves.not.toThrow();
            expect(mockClientRepository.remove).toHaveBeenCalledWith(mockClientEntity);
        });
    });
});