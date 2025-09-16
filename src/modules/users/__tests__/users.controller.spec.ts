import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateUserRequestDto } from '../dtos/create-user.request.dto';
import { CreateUserResponseDto } from '../dtos/create-user.response.dto';
import { UpdateUserRequestDto } from '../dtos/update-user.request.dto';
import { UpdateUserResponseDto } from '../dtos/update-user.response.dto';
import { GetUserResponseDto } from '../dtos/get-user.response.dto';
import { PaginatedUsersResponseDto } from '../dtos/paginated-users.response.dto';
import { GetUsersQueryDto } from '../dtos/get-users.query.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUsersService = {
        create: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockUser = {
        id: 'user-id-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.USER,
        lastLogin: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
    };

    const mockAuthUser = {
        id: 'current-user-id',
        email: 'current@example.com',
        role: UserRole.USER,
    };

    const mockRequest = {
        user: mockAuthUser,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a user successfully', async () => {
            const createUserDto: CreateUserRequestDto = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                role: UserRole.USER,
            };

            const expectedResponse: CreateUserResponseDto = {
                id: 'user-id-123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            };

            mockUsersService.create.mockResolvedValue(expectedResponse);

            const result = await controller.create(createUserDto);

            expect(service.create).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john.doe@example.com',
                rawPassword: 'password123',
                role: UserRole.USER,
            });
            expect(result).toEqual(expectedResponse);
        });

        it('should throw BadRequestException for invalid data', async () => {
            const createUserDto: CreateUserRequestDto = {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'password123',
                role: UserRole.USER,
            };

            mockUsersService.create.mockRejectedValue(new BadRequestException('Invalid email format'));

            await expect(controller.create(createUserDto)).rejects.toThrow(BadRequestException);
            expect(service.create).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should get user by id successfully for admin', async () => {
            const userId = 'user-id-123';
            const adminRequest = { user: { ...mockAuthUser, role: UserRole.ADMIN } };

            const expectedResponse: GetUserResponseDto = {
                id: 'user-id-123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            };

            mockUsersService.findOne.mockResolvedValue(expectedResponse);

            const result = await controller.findOne(userId, adminRequest);

            expect(service.findOne).toHaveBeenCalledWith(userId);
            expect(result).toEqual(expectedResponse);
        });

        it('should allow user to get their own data', async () => {
            const userId = 'current-user-id';
            const userRequest = { user: mockAuthUser };

            const expectedResponse: GetUserResponseDto = {
                id: 'current-user-id',
                name: 'Current User',
                email: 'current@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            };

            mockUsersService.findOne.mockResolvedValue(expectedResponse);

            const result = await controller.findOne(userId, userRequest);

            expect(service.findOne).toHaveBeenCalledWith(userId);
            expect(result).toEqual(expectedResponse);
        });

        it('should throw ForbiddenException when user tries to access other user data', async () => {
            const userId = 'other-user-id';
            const userRequest = { user: mockAuthUser };

            await expect(controller.findOne(userId, userRequest)).rejects.toThrow(ForbiddenException);
            expect(service.findOne).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException for non-existent user', async () => {
            const userId = 'non-existent-id';
            const adminRequest = { user: { ...mockAuthUser, role: UserRole.ADMIN } };

            mockUsersService.findOne.mockRejectedValue(new NotFoundException('User not found'));

            await expect(controller.findOne(userId, adminRequest)).rejects.toThrow(NotFoundException);
            expect(service.findOne).toHaveBeenCalledWith(userId);
        });
    });

    describe('findAll', () => {
        it('should get all users with filters successfully', async () => {
            const query: GetUsersQueryDto = {
                page: 1,
                limit: 10,
                search: 'john',
                role: UserRole.USER,
            };

            const serviceResponse = {
                users: [mockUser],
                total: 1,
            };

            const expectedResponse: PaginatedUsersResponseDto = {
                data: [
                    {
                        id: 'user-id-123',
                        name: 'John Doe',
                        email: 'john.doe@example.com',
                        role: UserRole.USER,
                        lastLogin: new Date('2023-01-01'),
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockUsersService.findAll.mockResolvedValue(serviceResponse);

            const result = await controller.findAll(query);

            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(result).toEqual(expectedResponse);
        });

        it('should get all users without filters', async () => {
            const query: GetUsersQueryDto = {};

            const serviceResponse = {
                users: [mockUser],
                total: 1,
            };

            const expectedResponse: PaginatedUsersResponseDto = {
                data: [mockUser],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockUsersService.findAll.mockResolvedValue(serviceResponse);

            const result = await controller.findAll(query);

            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(result).toEqual(expectedResponse);
        });
    });

    describe('update', () => {
        it('should update user successfully as admin', async () => {
            const userId = 'user-id-123';
            const updateUserDto: UpdateUserRequestDto = {
                name: 'John Updated',
                email: 'john.updated@example.com',
            };
            const adminRequest = { user: { ...mockAuthUser, role: UserRole.ADMIN } };

            const expectedResponse: UpdateUserResponseDto = {
                id: 'user-id-123',
                name: 'John Updated',
                email: 'john.updated@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
            };

            mockUsersService.update.mockResolvedValue(expectedResponse);

            const result = await controller.update(userId, updateUserDto, adminRequest);

            expect(service.update).toHaveBeenCalledWith({
                id: userId,
                name: 'John Updated',
                email: 'john.updated@example.com',
                rawPassword: undefined,
                role: undefined,
            });
            expect(result).toEqual(expectedResponse);
        });

        it('should allow user to update their own data', async () => {
            const userId = 'current-user-id';
            const updateUserDto: UpdateUserRequestDto = {
                name: 'Updated Name',
            };
            const userRequest = { user: mockAuthUser };

            const expectedResponse: UpdateUserResponseDto = {
                id: 'current-user-id',
                name: 'Updated Name',
                email: 'current@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
            };

            mockUsersService.update.mockResolvedValue(expectedResponse);

            const result = await controller.update(userId, updateUserDto, userRequest);

            expect(service.update).toHaveBeenCalled();
            expect(result).toEqual(expectedResponse);
        });

        it('should throw ForbiddenException when user tries to update other user', async () => {
            const userId = 'other-user-id';
            const updateUserDto: UpdateUserRequestDto = {
                name: 'Updated Name',
            };
            const userRequest = { user: mockAuthUser };

            await expect(controller.update(userId, updateUserDto, userRequest)).rejects.toThrow(ForbiddenException);
            expect(service.update).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user tries to change their role', async () => {
            const userId = 'current-user-id';
            const updateUserDto: UpdateUserRequestDto = {
                role: UserRole.ADMIN,
            };
            const userRequest = { user: mockAuthUser };

            await expect(controller.update(userId, updateUserDto, userRequest)).rejects.toThrow(ForbiddenException);
            expect(service.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException for non-existent user', async () => {
            const userId = 'non-existent-id';
            const updateUserDto: UpdateUserRequestDto = {
                name: 'Updated Name',
            };
            const adminRequest = { user: { ...mockAuthUser, role: UserRole.ADMIN } };

            mockUsersService.update.mockRejectedValue(new NotFoundException('User not found'));

            await expect(controller.update(userId, updateUserDto, adminRequest)).rejects.toThrow(NotFoundException);
            expect(service.update).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should delete user successfully', async () => {
            const userId = 'user-id-123';
            mockUsersService.remove.mockResolvedValue(undefined);
            const req = { user: { id: 'another-user-id' } };
            await controller.remove(userId, req);
            expect(service.remove).toHaveBeenCalledWith(userId);
        });

        it('should throw NotFoundException for non-existent user', async () => {
            const userId = 'non-existent-id';
            mockUsersService.remove.mockRejectedValue(new NotFoundException('User not found'));
            const req = { user: { id: 'another-user-id' } };
            await expect(controller.remove(userId, req)).rejects.toThrow(NotFoundException);
            expect(service.remove).toHaveBeenCalledWith(userId);
        });

        it('should throw ForbiddenException when trying to delete own user', async () => {
            const userId = 'user-id-123';
            const req = { user: { id: userId } };
            await expect(controller.remove(userId, req)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('Guards and Permissions', () => {
        it('should be protected by JwtAuthGuard', () => {
            const guards = Reflect.getMetadata('__guards__', UsersController);
            expect(guards).toContain(JwtAuthGuard);
        });

        it('should have ADMIN role requirement for create', () => {
            const roles = Reflect.getMetadata('roles', controller.create);
            expect(roles).toContain(UserRole.ADMIN);
        });

        it('should have ADMIN role requirement for findAll', () => {
            const roles = Reflect.getMetadata('roles', controller.findAll);
            expect(roles).toContain(UserRole.ADMIN);
        });

        it('should have ADMIN and USER role requirement for update', () => {
            const roles = Reflect.getMetadata('roles', controller.update);
            expect(roles).toContain(UserRole.ADMIN);
            expect(roles).toContain(UserRole.USER);
        });

        it('should have ADMIN role requirement for remove', () => {
            const roles = Reflect.getMetadata('roles', controller.remove);
            expect(roles).toContain(UserRole.ADMIN);
        });

        it('should allow USER and ADMIN roles for findOne', () => {
            const roles = Reflect.getMetadata('roles', controller.findOne);
            expect(roles).toContain(UserRole.USER);
            expect(roles).toContain(UserRole.ADMIN);
        });
    });

    describe('Swagger Documentation', () => {
        it('should have proper API tags', () => {
            const apiTags = Reflect.getMetadata('swagger/apiUseTags', UsersController);
            expect(apiTags).toContain('users');
        });

        it('should have proper response documentation for create', () => {
            const responses = Reflect.getMetadata('swagger/apiResponse', controller.create);
            expect(responses).toBeDefined();
        });

        it('should have proper response documentation for findOne', () => {
            const responses = Reflect.getMetadata('swagger/apiResponse', controller.findOne);
            expect(responses).toBeDefined();
        });
    });
});