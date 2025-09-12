import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('AuthModule (e2e)', () => {
    let app: INestApplication;
    let server: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalFilters(new HttpExceptionFilter());
        app.useGlobalInterceptors(new TransformInterceptor());
        await app.init();

        server = app.getHttpServer();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/auth/register (POST)', () => {
        it('should register a new user', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test1@example.com',
                    password: '12345678',
                    role: 'user',
                })
                .expect(201);

            expect(res.body.data.email).toBe('test1@example.com');
            expect(res.body.data).not.toHaveProperty('passwordHash');
        });

        it('should not allow duplicate email', async () => {
            await request(server)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test1@example.com',
                    password: '12345678',
                    role: 'user',
                })
                .expect(409);
        });

        it('should fail with invalid email', async () => {
            await request(server)
                .post('/api/auth/register')
                .send({
                    name: 'Invalid Email',
                    email: 'not-an-email',
                    password: '12345678',
                    role: 'user',
                })
                .expect(400);
        });

        it('should fail with short password', async () => {
            await request(server)
                .post('/api/auth/register')
                .send({
                    name: 'Short Pass',
                    email: 'short@example.com',
                    password: '123',
                    role: 'user',
                })
                .expect(400);
        });

        it('should fail with invalid role', async () => {
            await request(server)
                .post('/api/auth/register')
                .send({
                    name: 'Invalid Role',
                    email: 'role@example.com',
                    password: '12345678',
                    role: 'aaa',
                })
                .expect(400);
        });
    });

    describe('/auth/login (POST)', () => {
        it('should login with correct credentials', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'test1@example.com',
                    password: '12345678',
                })
                .expect(201); // login returns 201 Created

            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
            expect(res.body.data.expiresIn).toBeGreaterThan(0);
        });

        it('should fail with wrong password', async () => {
            await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'test1@example.com',
                    password: 'wrongpass',
                })
                .expect(401);
        });

        it('should fail if user does not exist', async () => {
            await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'ghost@example.com',
                    password: '12345678',
                })
                .expect(401);
        });
    });
});
