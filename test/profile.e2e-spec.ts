import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Profile e2e', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let jwtToken: string;
  let user: UserEntity;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(UserEntity));


    // Create a user with a real bcrypt hash for 'password123'
    const passwordHash = await bcrypt.hash('password123', 12);
    user = userRepository.create({
      name: 'Profile User',
      email: 'profile@example.com',
      passwordHash,
      role: UserRole.USER,
    });
    await userRepository.save(user);

    // Login to get JWT
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'profile@example.com', password: 'password123' });
    jwtToken = res.body.accessToken;
  });

  afterAll(async () => {
    await userRepository.delete({ email: 'profile@example.com' });
    await app.close();
  });

  it('should update profile name and email', async () => {
    const res = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'New Name',
        email: 'newprofile@example.com',
        currentPassword: 'password123',
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.email).toBe('newprofile@example.com');
  });

  it('should fail with wrong current password', async () => {
    const res = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Should Not Update',
        currentPassword: 'wrongpassword',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/current password/i);
  });

  it('should update password', async () => {
    const res = await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        currentPassword: 'password123',
        newPassword: 'newpassword456',
      });
    expect(res.status).toBe(200);
    // Try login with new password
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'newprofile@example.com', password: 'newpassword456' });
    expect(loginRes.status).toBe(201);
    expect(loginRes.body).toHaveProperty('accessToken');
  });
});
