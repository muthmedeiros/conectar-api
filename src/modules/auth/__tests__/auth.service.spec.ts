import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

const repoMock = {
    exists: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
};

const jwtServiceMock = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    decode: jest.fn().mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 900,
    }),
};

const configServiceMock = {
    get: jest.fn((key: string) => {
        switch (key) {
            case 'JWT_SECRET':
                return 'test-secret';
            case 'JWT_EXPIRES_IN':
                return '15m';
            case 'JWT_REFRESH_SECRET':
                return 'refresh-secret';
            default:
                return null;
        }
    }),
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AuthService(
            repoMock as any,
            jwtServiceMock as any,
            configServiceMock as any,
        );
    });

    describe('register', () => {
        it('should throw ConflictException if email is already in use', async () => {
            repoMock.exists.mockResolvedValue(true);

            await expect(
                service.register({
                    name: 'John',
                    email: 'john@example.com',
                    rawPassword: '12345678',
                    role: 'user',
                } as any),
            ).rejects.toThrow(ConflictException);
        });

        it('should save user and return mapped domain object', async () => {
            repoMock.exists.mockResolvedValue(false);
            repoMock.create.mockImplementation((u) => u);
            repoMock.save.mockResolvedValue({
                id: '1',
                name: 'John',
                email: 'john@example.com',
                role: 'user',
                passwordHash: 'hashed',
            });

            const result = await service.register({
                name: 'John',
                email: 'john@example.com',
                rawPassword: '12345678',
                role: 'user',
            } as any);

            expect(repoMock.save).toHaveBeenCalled();
            expect(result).toHaveProperty('id', '1');
            expect(result).toHaveProperty('email', 'john@example.com');
            expect(result).not.toHaveProperty('passwordHash'); // UserMapper remove
        });
    });

    describe('login', () => {
        it("should throw UnauthorizedException if user email doesn't exist", async () => {
            repoMock.findOne.mockResolvedValue(null);

            await expect(
                service.login('missing@example.com', '12345678'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password does not match', async () => {
            repoMock.findOne.mockResolvedValue({
                id: '1',
                email: 'john@example.com',
                passwordHash: 'wrong-hash',
                role: 'user',
            });
            jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

            await expect(
                service.login('john@example.com', 'badpass'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should return access and refresh tokens with expiresIn when login succeeds', async () => {
            repoMock.findOne.mockResolvedValue({
                id: '1',
                email: 'john@example.com',
                passwordHash: 'hash',
                role: 'user',
            });
            jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);

            const tokens = await service.login('john@example.com', '12345678');

            expect(tokens).toHaveProperty('accessToken', 'signed-token');
            expect(tokens).toHaveProperty('refreshToken', 'signed-token');
            expect(tokens.expiresIn).toBeGreaterThan(0);
        });
    });
});
