import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../users/domain/user.model';
import { ClientsController } from '../clients.controller';
import { ClientsService } from '../clients.service';
import { CreateClientRequestDto } from '../dtos/create-client.request.dto';
import { GetClientsQueryDto } from '../dtos/get-clients.query.dto';
import { UpdateClientRequestDto } from '../dtos/update-client.request.dto';
import { ClientStatus } from '../enums/client-status.enum';

describe('ClientsController', () => {
    let controller: ClientsController;
    let service: ClientsService;

    const mockClientsService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        addUserToClient: jest.fn(),
        removeUserFromClient: jest.fn(),
    };

    const mockAdminUser: User = {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ClientsController],
            providers: [
                {
                    provide: ClientsService,
                    useValue: mockClientsService,
                },
                {
                    provide: require('../../users/users.service').UsersService,
                    useValue: {},
                },
            ],
        }).compile();

        controller = module.get<ClientsController>(ClientsController);
        service = module.get<ClientsService>(ClientsService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a client', async () => {
            const dto: CreateClientRequestDto = {
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                adminUserId: 'admin-id',
            };

            const mockClient = {
                id: 'client-id',
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: 'admin-id',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const req = { user: mockAdminUser };

            mockClientsService.create.mockResolvedValue(mockClient);

            const result = await controller.create(dto);

            expect(service.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    corporateReason: dto.corporateReason,
                    cnpj: dto.cnpj,
                    name: dto.name,
                    adminUserId: dto.adminUserId,
                })
            );
            expect(result).toBeDefined();
        });
    });

    describe('findAll', () => {
        it('should return paginated clients', async () => {
            const query: GetClientsQueryDto = {
                page: 1,
                limit: 20,
            };

            const mockResult = {
                clients: [
                    {
                        id: 'client-id',
                        corporateReason: 'Test Corp',
                        cnpj: '12.345.678/0001-90',
                        name: 'Test Client',
                        status: ClientStatus.ACTIVE,
                        conectarPlus: false,
                        adminUserId: 'admin-id',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                total: 1,
            };

            const req = { user: mockAdminUser };

            mockClientsService.findAll.mockResolvedValue(mockResult);

            const result = await controller.findAll(query, req);

            expect(service.findAll).toHaveBeenCalledWith(query, mockAdminUser);
            expect(result).toEqual({
                clients: expect.any(Array),
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            });
        });
    });

    describe('findOne', () => {
        it('should return a single client', async () => {
            const clientId = 'client-id';
            const mockClient = {
                id: clientId,
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: 'admin-id',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const req = { user: mockAdminUser };

            mockClientsService.findOne.mockResolvedValue(mockClient);

            const result = await controller.findOne(clientId, req);

            expect(service.findOne).toHaveBeenCalledWith(clientId, mockAdminUser);
            expect(result).toBeDefined();
        });
    });

    describe('update', () => {
        it('should update a client', async () => {
            const clientId = 'client-id';
            const dto: UpdateClientRequestDto = {
                name: 'Updated Client Name',
            };

            const mockUpdatedClient = {
                id: clientId,
                corporateReason: 'Test Corp',
                cnpj: '12.345.678/0001-90',
                name: 'Updated Client Name',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: 'admin-id',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const req = { user: mockAdminUser };

            mockClientsService.update.mockResolvedValue(mockUpdatedClient);

            const result = await controller.update(clientId, dto, req);

            expect(service.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: clientId,
                    name: dto.name,
                }),
                mockAdminUser
            );
            expect(result).toBeDefined();
        });
    });

    describe('remove', () => {
        it('should remove a client', async () => {
            const clientId = 'client-id';
            const req = { user: mockAdminUser };

            mockClientsService.remove.mockResolvedValue(undefined);

            await controller.remove(clientId);

            expect(service.remove).toHaveBeenCalledWith(clientId);
        });
    });

    describe('addUserToClient', () => {
        it('should add user to client', async () => {
            const clientId = 'client-id';
            const userId = 'user-id';
            const req = { user: mockAdminUser };

            mockClientsService.addUserToClient.mockResolvedValue(undefined);

            await controller.addUserToClient(clientId, userId);

            expect(service.addUserToClient).toHaveBeenCalledWith(clientId, userId);
        });
    });

    describe('removeUserFromClient', () => {
        it('should remove user from client', async () => {
            const clientId = 'client-id';
            const userId = 'user-id';
            const req = { user: mockAdminUser };

            mockClientsService.removeUserFromClient.mockResolvedValue(undefined);

            await controller.removeUserFromClient(clientId, userId);

            expect(service.removeUserFromClient).toHaveBeenCalledWith(clientId, userId);
        });
    });
});