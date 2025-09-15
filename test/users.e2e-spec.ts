import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { CreateUserRequestDto } from '../src/modules/users/dtos/create-user.request.dto';
import { UpdateUserRequestDto } from '../src/modules/users/dtos/update-user.request.dto';
import { UserEntity } from '../src/modules/users/entities/user.entity';

describe('Users (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<UserEntity>;
    let jwtService: JwtService;

    let adminUser: UserEntity;
    let regularUser: UserEntity;
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }));

        userRepository = moduleFixture.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        jwtService = moduleFixture.get<JwtService>(JwtService);

        await app.init();
    });

    beforeEach(async () => {
        // Clean database
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

        // Create regular user
        const userPasswordHash = await bcrypt.hash('user123', 12);
        regularUser = await userRepository.save({
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Regular User',
            email: 'user@example.com',
            passwordHash: userPasswordHash,
            role: UserRole.USER,
        });

        // Generate tokens
        adminToken = jwtService.sign({
            sub: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
        });

        userToken = jwtService.sign({
            sub: regularUser.id,
            email: regularUser.email,
            role: regularUser.role,
        });
    });

    afterAll(async () => {
        await userRepository.clear();
        await app.close();
    });

    describe('POST /users', () => {
        it('should create user as admin', async () => {
            const createUserDto: CreateUserRequestDto = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
                role: UserRole.USER,
            };

            const response = await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(201);

            expect(response.body).toMatchObject({
                id: expect.any(String),
                name: 'New User',
                email: 'newuser@example.com',
                role: UserRole.USER,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });
            expect(response.body).not.toHaveProperty('passwordHash');

            // Verify user was created in database
            const createdUser = await userRepository.findOne({
                where: { email: 'newuser@example.com' },
            });
            expect(createdUser).toBeDefined();
            expect(createdUser!.name).toBe('New User');
            expect(createdUser!.role).toBe(UserRole.USER);
        });

        it('should not create user as regular user', async () => {
            const createUserDto: CreateUserRequestDto = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
                role: UserRole.USER,
            };

            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${userToken}`)
                .send(createUserDto)
                .expect(403);
        });

        it('should not create user without authentication', async () => {
            const createUserDto: CreateUserRequestDto = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
                role: UserRole.USER,
            };

            await request(app.getHttpServer())
                .post('/users')
                .send(createUserDto)
                .expect(401);
        });

        it('should not create user with invalid email', async () => {
            const createUserDto = {
                name: 'New User',
                email: 'invalid-email',
                password: 'password123',
                role: UserRole.USER,
            };

            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(400);
        });

        it('should not create user with duplicate email', async () => {
            const createUserDto: CreateUserRequestDto = {
                name: 'Duplicate User',
                email: 'user@example.com', // Same as existing user
                password: 'password123',
                role: UserRole.USER,
            };

            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(createUserDto)
                .expect(409);
        });
    });

    describe('GET /users', () => {
        it('should get all users as admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('totalPages');
            expect(response.body).toHaveProperty('hasNext');
            expect(response.body).toHaveProperty('hasPrev');

            expect(response.body.data).toHaveLength(2);
            expect(response.body.total).toBe(2);
        });

        it('should filter users by role', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .query({ role: UserRole.ADMIN })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].role).toBe(UserRole.ADMIN);
        });

        it('should search users by name', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .query({ search: 'Admin' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toContain('Admin');
        });

        it('should paginate users', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .query({ page: 1, limit: 1 })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(1);
            expect(response.body.totalPages).toBe(2);
            expect(response.body.hasNext).toBe(true);
        });

        it('should not get users as regular user', async () => {
            await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should not get users without authentication', async () => {
            await request(app.getHttpServer())
                .get('/users')
                .expect(401);
        });
    });

    describe('GET /users/:id', () => {
        it('should get user by id as admin', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toMatchObject({
                id: regularUser.id,
                name: 'Regular User',
                email: 'user@example.com',
                role: UserRole.USER,
            });
            expect(response.body).not.toHaveProperty('passwordHash');
        });

        it('should get own user data as regular user', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toMatchObject({
                id: regularUser.id,
                name: 'Regular User',
                email: 'user@example.com',
                role: UserRole.USER,
            });
        });

        it('should not get other user data as regular user', async () => {
            await request(app.getHttpServer())
                .get(`/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should return 404 for non-existent user', async () => {
            await request(app.getHttpServer())
                .get('/users/non-existent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400); // UUID validation error
        });

        it('should return 400 for invalid UUID', async () => {
            await request(app.getHttpServer())
                .get('/users/invalid-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('should not get user without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/users/${regularUser.id}`)
                .expect(401);
        });
    });

    describe('PUT /users/:id', () => {
        it('should update user as admin', async () => {
            const updateUserDto: UpdateUserRequestDto = {
                name: 'Updated Name',
                email: 'updated@example.com',
            };

            const response = await request(app.getHttpServer())
                .put(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(200);

            expect(response.body).toMatchObject({
                id: regularUser.id,
                name: 'Updated Name',
                email: 'updated@example.com',
                role: UserRole.USER,
            });

            // Verify user was updated in database
            const updatedUser = await userRepository.findOne({
                where: { id: regularUser.id },
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser!.name).toBe('Updated Name');
            expect(updatedUser!.email).toBe('updated@example.com');
        });

        it('should update own data as regular user', async () => {
            const updateUserDto: UpdateUserRequestDto = {
                name: 'Self Updated',
            };

            const response = await request(app.getHttpServer())
                .put(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateUserDto)
                .expect(200);

            expect(response.body.name).toBe('Self Updated');
        });

        it('should not update other user as regular user', async () => {
            const updateUserDto: UpdateUserRequestDto = {
                name: 'Hacked Name',
            };

            await request(app.getHttpServer())
                .put(`/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateUserDto)
                .expect(403);
        });

        it('should not allow regular user to change role', async () => {
            const updateUserDto: UpdateUserRequestDto = {
                role: UserRole.ADMIN,
            };

            await request(app.getHttpServer())
                .put(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateUserDto)
                .expect(403);
        });

        it('should allow admin to change user role', async () => {
            const updateUserDto: UpdateUserRequestDto = {
                role: UserRole.ADMIN,
            };

            const response = await request(app.getHttpServer())
                .put(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(200);

            expect(response.body.role).toBe(UserRole.ADMIN);
        });

        it('should not update user with invalid email', async () => {
            const updateUserDto = {
                email: 'invalid-email',
            };

            await request(app.getHttpServer())
                .put(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateUserDto)
                .expect(400);
        });

        it('should not update user without authentication', async () => {
            const updateUserDto: UpdateUserRequestDto = {
                name: 'No Auth Update',
            };

            await request(app.getHttpServer())
                .put(`/users/${regularUser.id}`)
                .send(updateUserDto)
                .expect(401);
        });
    });

    describe('DELETE /users/:id', () => {
        it('should delete user as admin', async () => {
            await request(app.getHttpServer())
                .delete(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);

            // Verify user was deleted from database
            const deletedUser = await userRepository.findOne({
                where: { id: regularUser.id },
            });
            expect(deletedUser).toBeNull();
        });

        it('should not delete user as regular user', async () => {
            await request(app.getHttpServer())
                .delete(`/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should return 404 when deleting non-existent user', async () => {
            // First delete the user
            await userRepository.delete(regularUser.id);

            await request(app.getHttpServer())
                .delete(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should not delete user without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/users/${regularUser.id}`)
                .expect(401);
        });
    });

    describe('Authentication and Authorization', () => {
        it('should reject invalid JWT token', async () => {
            await request(app.getHttpServer())
                .get('/users')
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
                .get('/users')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });

        it('should reject malformed Authorization header', async () => {
            await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', 'Malformed header')
                .expect(401);
        });
    });
});