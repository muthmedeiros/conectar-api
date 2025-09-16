import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { CreateClientRequestDto } from '../src/modules/clients/dtos/create-client.request.dto';
import { UpdateClientRequestDto } from '../src/modules/clients/dtos/update-client.request.dto';
import { ClientEntity } from '../src/modules/clients/entities/client.entity';
import { ClientStatus } from '../src/modules/clients/enums/client-status.enum';
import { UserEntity } from '../src/modules/users/entities/user.entity';

describe('Clients (e2e)', () => {
    let app: INestApplication;
    let clientRepository: Repository<ClientEntity>;
    let userRepository: Repository<UserEntity>;
    let jwtService: JwtService;

    let adminUser: UserEntity;
    let managerUser: UserEntity;
    let regularUser: UserEntity;
    let adminToken: string;
    let managerToken: string;
    let userToken: string;
    let testClient: ClientEntity;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }));

        clientRepository = moduleFixture.get<Repository<ClientEntity>>(getRepositoryToken(ClientEntity));
        userRepository = moduleFixture.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        jwtService = moduleFixture.get<JwtService>(JwtService);

        await app.init();
    });

    beforeEach(async () => {
        // Clean database in proper order (child tables first due to FK constraints)
        await clientRepository.query('DELETE FROM client_users');
        await clientRepository.clear();
        await userRepository.clear();

        // Create admin user
        const adminPasswordHash = await bcrypt.hash('admin123', 12);
        adminUser = await userRepository.save({
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Admin User',
            email: 'admin@example.com',
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
        });

        // Create manager user (using ADMIN role since MANAGER doesn't exist)
        const managerPasswordHash = await bcrypt.hash('manager123', 12);
        managerUser = await userRepository.save({
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Manager User',
            email: 'manager@example.com',
            passwordHash: managerPasswordHash,
            role: UserRole.ADMIN,
        });

        // Create regular user
        const userPasswordHash = await bcrypt.hash('user123', 12);
        regularUser = await userRepository.save({
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Regular User',
            email: 'user@example.com',
            passwordHash: userPasswordHash,
            role: UserRole.USER,
        });

        // Create test client
        testClient = await clientRepository.save({
            id: '660e8400-e29b-41d4-a716-446655440000',
            corporateReason: 'Test Client Ltda',
            cnpj: '12.345.678/0001-90',
            name: 'Test Client',
            tags: 'test,client',
            status: ClientStatus.ACTIVE,
            conectarPlus: false,
            adminUserId: adminUser.id,
            adminUser: adminUser,
            users: [regularUser],
        });

        // Generate tokens
        adminToken = jwtService.sign({
            sub: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
        });

        managerToken = jwtService.sign({
            sub: managerUser.id,
            email: managerUser.email,
            role: managerUser.role,
        });

        userToken = jwtService.sign({
            sub: regularUser.id,
            email: regularUser.email,
            role: regularUser.role,
        });
    });

    afterAll(async () => {
        // Clean database in proper order
        await clientRepository.query('DELETE FROM client_users');
        await clientRepository.clear();
        await userRepository.clear();
        await app.close();
    });

    describe('POST /clients', () => {
        it('should create client as admin', async () => {
            const createClientDto: CreateClientRequestDto = {
                corporateReason: 'New Client Ltda',
                cnpj: '98.765.432/0001-01',
                name: 'New Client',
                tags: 'new,test',
                adminUserId: adminUser.id,
            };

            const response = await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createClientDto)
                .expect(201);

            expect(response.body).toMatchObject({
                id: expect.any(String),
                corporateReason: 'New Client Ltda',
                cnpj: '98.765.432/0001-01',
                name: 'New Client',
                tags: ['new', 'test'],
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: adminUser.id,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });

            // Verify client was created in database
            const createdClient = await clientRepository.findOne({
                where: { cnpj: '98.765.432/0001-01' },
                relations: ['adminUser', 'users'],
            });
            expect(createdClient).toBeDefined();
            expect(createdClient!.name).toBe('New Client');
        });

        it('should create client as manager', async () => {
            const createClientDto: CreateClientRequestDto = {
                corporateReason: 'Manager Client Ltda',
                cnpj: '98.765.432/0001-02',
                name: 'Manager Client',
                tags: 'manager,test',
                adminUserId: adminUser.id,
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(createClientDto)
                .expect(201);
        });

        it('should not create client as regular user', async () => {
            const createClientDto: CreateClientRequestDto = {
                corporateReason: 'User Client Ltda',
                cnpj: '98.765.432/0001-03',
                name: 'User Client',
                tags: 'user,test',
                adminUserId: adminUser.id,
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${userToken}`)
                .send(createClientDto)
                .expect(403);
        });

        it('should not create client without authentication', async () => {
            const createClientDto: CreateClientRequestDto = {
                corporateReason: 'No Auth Client Ltda',
                cnpj: '98.765.432/0001-04',
                name: 'No Auth Client',
                tags: 'noauth,test',
                adminUserId: adminUser.id,
            };

            await request(app.getHttpServer())
                .post('/clients')
                .send(createClientDto)
                .expect(401);
        });

        it('should not create client with invalid CNPJ', async () => {
            const createClientDto = {
                corporateReason: 'Invalid CNPJ Client Ltda',
                cnpj: 'invalid-cnpj',
                name: 'Invalid CNPJ Client',
                tags: 'invalid,test',
                adminUserId: adminUser.id,
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createClientDto)
                .expect(400);
        });

        it('should not create client with duplicate CNPJ', async () => {
            const createClientDto: CreateClientRequestDto = {
                corporateReason: 'Duplicate CNPJ Client Ltda',
                cnpj: '12.345.678/0001-90', // Same as existing client
                name: 'Duplicate CNPJ Client',
                tags: 'duplicate,test',
                adminUserId: adminUser.id,
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createClientDto)
                .expect(409);
        });

        it('should not create client with non-existent admin user', async () => {
            const createClientDto: CreateClientRequestDto = {
                corporateReason: 'Invalid Admin Client Ltda',
                cnpj: '98.765.432/0001-05',
                name: 'Invalid Admin Client',
                tags: 'invalid,admin',
                adminUserId: '550e8400-e29b-41d4-a716-446655440999',
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createClientDto)
                .expect(404);
        });
    });

    describe('GET /clients', () => {
        it('should get all clients as admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('clients');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('totalPages');
            expect(response.body).toHaveProperty('hasNextPage');
            expect(response.body).toHaveProperty('hasPreviousPage');

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.total).toBe(1);
        });

        it('should get all clients as manager', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.total).toBe(1);
        });

        it('should get only assigned clients as regular user', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.clients[0].adminUser.id).toBe(adminUser.id);
        });

        it('should filter clients by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients')
                .query({ status: ClientStatus.ACTIVE })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.clients[0].status).toBe(ClientStatus.ACTIVE);
        });

        it('should search clients by name', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients')
                .query({ search: 'Test' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.clients[0].name).toContain('Test');
        });

        it('should search clients by CNPJ', async () => {
            const response = await request(app.getHttpServer())
                .get('/clients')
                .query({ search: '12.345.678/0001-90' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.clients[0].cnpj).toBe('12.345.678/0001-90');
        });

        it('should paginate clients', async () => {
            // Create another client for pagination test
            await clientRepository.save({
                id: '660e8400-e29b-41d4-a716-446655440001',
                corporateReason: 'Second Client Ltda',
                cnpj: '98.765.432/0001-90',
                name: 'Second Client',
                tags: 'second,test',
                status: ClientStatus.ACTIVE,
                conectarPlus: true,
                adminUserId: adminUser.id,
                adminUser: adminUser,
                users: [],
            });

            const response = await request(app.getHttpServer())
                .get('/clients')
                .query({ page: 1, limit: 1 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(1);
            expect(response.body.totalPages).toBe(2);
            expect(response.body.hasNextPage).toBe(true);
        });

        it('should filter by conectarPlus', async () => {
            // Update client to have conectarPlus true
            await clientRepository.update(testClient.id, { conectarPlus: true });

            const response = await request(app.getHttpServer())
                .get('/clients')
                .query({ conectarPlus: 'true' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.clients).toHaveLength(1);
            expect(response.body.clients[0].conectarPlus).toBe(true);
        });

        it('should not get clients without authentication', async () => {
            await request(app.getHttpServer())
                .get('/clients')
                .expect(401);
        });
    });

    describe('GET /clients/:id', () => {
        it('should get client by id as admin', async () => {
            const response = await request(app.getHttpServer())
                .get(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toMatchObject({
                corporateReason: 'Test Client Ltda',
                cnpj: '12.345.678/0001-90',
                name: 'Test Client',
                tags: ['test', 'client'],
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
            });
            expect(response.body.adminUser.id).toBe(adminUser.id);
        });

        it('should get client by id as manager', async () => {
            const response = await request(app.getHttpServer())
                .get(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(response.body.adminUser.id).toBe(adminUser.id);
        });

        it('should get assigned client as regular user', async () => {
            const response = await request(app.getHttpServer())
                .get(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.adminUser.id).toBe(adminUser.id);
        });

        it('should not get unassigned client as regular user', async () => {
            // Create a client not assigned to regularUser
            const unassignedClient = await clientRepository.save({
                id: '660e8400-e29b-41d4-a716-446655440002',
                corporateReason: 'Unassigned Client Ltda',
                cnpj: '11.111.111/0001-11',
                name: 'Unassigned Client',
                tags: 'unassigned',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: adminUser.id,
                adminUser: adminUser,
                users: [],
            });

            await request(app.getHttpServer())
                .get(`/clients/${unassignedClient.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });

        it('should return 404 for non-existent client', async () => {
            await request(app.getHttpServer())
                .get('/clients/660e8400-e29b-41d4-a716-446655440999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(app.getHttpServer())
                .get('/clients/invalid-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should not get client without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/clients/${testClient.id}`)
                .expect(401);
        });
    });

    describe('PUT /clients/:id', () => {
        it('should update client as admin', async () => {
            const updateClientDto: UpdateClientRequestDto = {
                name: 'Updated Client Name',
                tags: 'updated,tags',
                status: ClientStatus.INACTIVE,
                conectarPlus: true,
            };

            const response = await request(app.getHttpServer())
                .put(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateClientDto)
                .expect(200);

            expect(response.body).toMatchObject({
                name: 'Updated Client Name',
                tags: ['updated', 'tags'],
                status: ClientStatus.INACTIVE,
                conectarPlus: true,
            });

            // Verify client was updated in database
            const updatedClient = await clientRepository.findOne({
                where: { id: testClient.id },
            });
            expect(updatedClient).toBeDefined();
            expect(updatedClient!.name).toBe('Updated Client Name');
            expect(updatedClient!.status).toBe(ClientStatus.INACTIVE);
            expect(updatedClient!.conectarPlus).toBe(true);
        });

        it('should update client as manager', async () => {
            const updateClientDto: UpdateClientRequestDto = {
                name: 'Manager Updated Client',
            };

            const response = await request(app.getHttpServer())
                .put(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send(updateClientDto)
                .expect(200);

            expect(response.body.name).toBe('Manager Updated Client');
        });

        it('should update client corporate reason', async () => {
            const updateClientDto: UpdateClientRequestDto = {
                corporateReason: 'Updated Corporate Reason Ltda',
            };

            const response = await request(app.getHttpServer())
                .put(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateClientDto)
                .expect(200);

            expect(response.body.corporateReason).toBe('Updated Corporate Reason Ltda');

            // Verify corporate reason was updated
            const updatedClient = await clientRepository.findOne({
                where: { id: testClient.id },
            });
            expect(updatedClient!.corporateReason).toBe('Updated Corporate Reason Ltda');
        });

        it('should not update client with invalid CNPJ', async () => {
            const updateClientDto = {
                cnpj: 'invalid-cnpj',
            };

            await request(app.getHttpServer())
                .put(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateClientDto)
                .expect(400);
        });

        it('should return 404 when updating non-existent client', async () => {
            const updateClientDto: UpdateClientRequestDto = {
                name: 'Non-existent Client',
            };

            await request(app.getHttpServer())
                .put('/clients/660e8400-e29b-41d4-a716-446655440999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateClientDto)
                .expect(404);
        });

        it('should not update client without authentication', async () => {
            const updateClientDto: UpdateClientRequestDto = {
                name: 'No Auth Update',
            };

            await request(app.getHttpServer())
                .put(`/clients/${testClient.id}`)
                .send(updateClientDto)
                .expect(401);
        });
    });

    describe('DELETE /clients/:id', () => {
        it('should delete client as admin', async () => {
            await request(app.getHttpServer())
                .delete(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);

            // Verify client was deleted from database
            const deletedClient = await clientRepository.findOne({
                where: { id: testClient.id },
            });
            expect(deletedClient).toBeNull();
        });

        it('should delete client as manager', async () => {
            await request(app.getHttpServer())
                .delete(`/clients/${testClient.id}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(204);
        });

        it('should return 404 when deleting non-existent client', async () => {
            await request(app.getHttpServer())
                .delete('/clients/660e8400-e29b-41d4-a716-446655440999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not delete client without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/clients/${testClient.id}`)
                .expect(401);
        });
    });

    describe('Authentication and Authorization', () => {
        it('should reject invalid JWT token', async () => {
            await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should reject expired JWT token', async () => {
            const expiredToken = jwtService.sign(
                {
                    sub: adminUser.id,
                    email: adminUser.email,
                    role: adminUser.role,
                },
                { expiresIn: '-1h' } // Expired token
            );

            await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });

        it('should reject malformed Authorization header', async () => {
            await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', 'Malformed header')
                .expect(401);
        });
    });

    describe('Role-based Data Access', () => {
        it('should show different data sets based on user role', async () => {
            // Create additional test data
            const unassignedClient = await clientRepository.save({
                id: '660e8400-e29b-41d4-a716-446655440003',
                corporateReason: 'Unassigned Client Ltda',
                cnpj: '22.222.222/0002-22',
                name: 'Unassigned Client',
                tags: 'unassigned',
                status: ClientStatus.ACTIVE,
                conectarPlus: false,
                adminUserId: adminUser.id,
                adminUser: adminUser,
                users: [],
            });

            // Admin should see all clients
            const adminResponse = await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(adminResponse.body.clients).toHaveLength(2);

            // Manager should see all clients
            const managerResponse = await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);
            expect(managerResponse.body.clients).toHaveLength(2);

            // Regular user should see only assigned clients
            const userResponse = await request(app.getHttpServer())
                .get('/clients')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(userResponse.body.clients).toHaveLength(1);
            expect(userResponse.body.clients[0].adminUser.id).toBe(adminUser.id);
        });
    });

    describe('Data Validation', () => {
        it('should validate CNPJ format', async () => {
            const invalidCnpjs = [
                '123', // Too short
                '12345678000190123', // Too long
                'abcd1234567890', // Contains letters
            ];

            for (const cnpj of invalidCnpjs) {
                await request(app.getHttpServer())
                    .post('/clients')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        corporateReason: 'Test Client Ltda',
                        cnpj,
                        name: 'Test Client',
                        tags: 'test',
                        adminUserId: adminUser.id,
                    })
                    .expect(400);
            }
        });

        it('should validate required fields', async () => {
            const incompleteClient = {
                name: 'Incomplete Client',
                // Missing corporateReason, cnpj, adminUserId
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(incompleteClient)
                .expect(400);
        });

        it('should validate client status enum', async () => {
            const invalidStatus = {
                corporateReason: 'Invalid Status Client Ltda',
                cnpj: '33.333.333/0003-33',
                name: 'Invalid Status Client',
                tags: 'test',
                status: 'INVALID_STATUS',
                adminUserId: adminUser.id,
            };

            await request(app.getHttpServer())
                .post('/clients')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidStatus)
                .expect(400);
        });
    });

    describe('User Assignment Endpoints', () => {
        it('should add user to client as admin', async () => {
            await request(app.getHttpServer())
                .post(`/clients/${testClient.id}/users/${managerUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);

            // Verify user was added to client
            const updatedClient = await clientRepository.findOne({
                where: { id: testClient.id },
                relations: ['users'],
            });
            expect(updatedClient!.users.some(user => user.id === managerUser.id)).toBe(true);
        });

        it('should remove user from client as admin', async () => {
            // First add the user
            await request(app.getHttpServer())
                .post(`/clients/${testClient.id}/users/${managerUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);

            // Then remove the user
            await request(app.getHttpServer())
                .delete(`/clients/${testClient.id}/users/${managerUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);

            // Verify user was removed from client
            const updatedClient = await clientRepository.findOne({
                where: { id: testClient.id },
                relations: ['users'],
            });
            expect(updatedClient!.users.some(user => user.id === managerUser.id)).toBe(false);
        });

        it('should return 404 when adding user to non-existent client', async () => {
            await request(app.getHttpServer())
                .post('/clients/660e8400-e29b-41d4-a716-446655440999/users/' + managerUser.id)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should return 404 when adding non-existent user to client', async () => {
            await request(app.getHttpServer())
                .post(`/clients/${testClient.id}/users/660e8400-e29b-41d4-a716-446655440999`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});