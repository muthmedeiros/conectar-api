import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<UserEntity>;

    const mockRepository = {
        exists: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

        jest.clearAllMocks();
        mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should throw ConflictException if email already exists', async () => {
            mockRepository.exists.mockResolvedValue(true);

            await expect(
                service.create({
                    name: 'John Doe',
                    email: 'john@example.com',
                    rawPassword: 'password123',
                    role: UserRole.USER,
                }),
            ).rejects.toThrow(ConflictException);
            
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { email: 'john@example.com' },
            });
        });

        it('should create user successfully', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                rawPassword: 'password123',
                role: UserRole.USER,
            };

            const savedUser = {
                id: '1',
                name: userData.name,
                email: userData.email,
                role: userData.role,
                passwordHash: 'hashed-password',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRepository.exists.mockResolvedValue(false);
            mockRepository.create.mockReturnValue(savedUser);
            mockRepository.save.mockResolvedValue(savedUser);

            const result = await service.create(userData);

            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { email: userData.email },
            });
            expect(mockRepository.create).toHaveBeenCalledWith({
                name: userData.name,
                email: userData.email,
                passwordHash: expect.any(String),
                role: userData.role,
            });
            expect(mockRepository.save).toHaveBeenCalledWith(savedUser);
            expect(result).toEqual({
                id: savedUser.id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                createdAt: savedUser.createdAt,
                updatedAt: savedUser.updatedAt,
            });
        });
    });

    describe('findAll', () => {
        it('should return paginated users with default parameters', async () => {
            const users = [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: UserRole.USER,
                    passwordHash: 'hashed',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    name: 'Jane Admin',
                    email: 'jane@example.com',
                    role: UserRole.ADMIN,
                    passwordHash: 'hashed',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 2]);

            const result = await service.findAll({});

            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
            expect(result.users).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should return filtered and paginated users', async () => {
            const users = [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: UserRole.USER,
                    passwordHash: 'hashed',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 1]);

            const result = await service.findAll({
                role: UserRole.USER,
                search: 'john',
                orderBy: 'name',
                order: 'ASC',
                page: 2,
                limit: 10,
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.role = :role', {
                role: UserRole.USER,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
                { search: '%john%' },
            );
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.name', 'ASC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result.users).toHaveLength(1);
            expect(result.total).toBe(1);
        });
    });

    describe('findOne', () => {
        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
            
            expect(mockRepository.findOne).toHaveBeenCalledWith({ 
                where: { id: 'non-existent-id' } 
            });
        });

        it('should return user if found', async () => {
            const userEntity = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                passwordHash: 'hashed-password',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRepository.findOne.mockResolvedValue(userEntity);

            const result = await service.findOne('1');

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual({
                id: userEntity.id,
                name: userEntity.name,
                email: userEntity.email,
                role: userEntity.role,
                createdAt: userEntity.createdAt,
                updatedAt: userEntity.updatedAt,
            });
        });
    });

    describe('update', () => {
        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                service.update({
                    id: 'non-existent-id',
                    name: 'Updated Name',
                }),
            ).rejects.toThrow(NotFoundException);

            expect(mockRepository.findOne).toHaveBeenCalledWith({ 
                where: { id: 'non-existent-id' } 
            });
        });

        it('should throw ConflictException if email already exists', async () => {
            const existingUser = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                passwordHash: 'hashed',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRepository.findOne.mockResolvedValue(existingUser);
            mockRepository.exists.mockResolvedValue(true);

            await expect(
                service.update({
                    id: '1',
                    email: 'other@example.com',
                }),
            ).rejects.toThrow(ConflictException);

            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { email: 'other@example.com' },
            });
        });

        it('should update user successfully', async () => {
            const existingUser = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                passwordHash: 'old-hash',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedUser = {
                ...existingUser,
                name: 'John Updated',
                email: 'john.updated@example.com',
                passwordHash: 'new-hash',
                updatedAt: new Date(),
            };

            mockRepository.findOne.mockResolvedValue(existingUser);
            mockRepository.exists.mockResolvedValue(false);
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.update({
                id: '1',
                name: 'John Updated',
                email: 'john.updated@example.com',
                rawPassword: 'newpassword123',
                role: UserRole.ADMIN,
            });

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { email: 'john.updated@example.com' },
            });
            expect(mockRepository.save).toHaveBeenCalledWith({
                ...existingUser,
                name: 'John Updated',
                email: 'john.updated@example.com',
                role: UserRole.ADMIN,
                passwordHash: expect.any(String),
            });
            expect(result.name).toBe('John Updated');
            expect(result.email).toBe('john.updated@example.com');
        });
    });

    describe('remove', () => {
        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);

            expect(mockRepository.findOne).toHaveBeenCalledWith({ 
                where: { id: 'non-existent-id' } 
            });
        });

        it('should remove user successfully', async () => {
            const user = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                passwordHash: 'hashed',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRepository.findOne.mockResolvedValue(user);
            mockRepository.remove.mockResolvedValue(user);

            await service.remove('1');

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(mockRepository.remove).toHaveBeenCalledWith(user);
        });
    });
});