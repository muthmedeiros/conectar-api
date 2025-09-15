import { GetUserResponseDto } from '../../dtos/get-user.response.dto';
import { GetUserMapper } from '../../mappers/get-user.mapper';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('GetUserMapper', () => {
    describe('toResponse', () => {
        it('should map user domain to response DTO with all fields', () => {
            const user = {
                id: 'user-id-123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-01-02T00:00:00.000Z'),
            };

            const response: GetUserResponseDto = GetUserMapper.toResponse(user);

            expect(response).toEqual({
                id: 'user-id-123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-01-02T00:00:00.000Z'),
            });
        });

        it('should exclude sensitive fields like passwordHash', () => {
            const user = {
                id: 'user-id-123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-01-02T00:00:00.000Z'),
                passwordHash: '$2b$10$hashedPassword123', // This should be excluded
            } as any;

            const response: GetUserResponseDto = GetUserMapper.toResponse(user);

            expect(response).not.toHaveProperty('passwordHash');
            expect(response).toEqual({
                id: 'user-id-123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-01-02T00:00:00.000Z'),
            });
        });

        it('should handle user with minimal required fields', () => {
            const user = {
                id: 'user-id-456',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-06-15T10:30:00.000Z'),
                updatedAt: new Date('2023-06-15T10:30:00.000Z'),
            };

            const response: GetUserResponseDto = GetUserMapper.toResponse(user);

            expect(response).toEqual({
                id: 'user-id-456',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-06-15T10:30:00.000Z'),
                updatedAt: new Date('2023-06-15T10:30:00.000Z'),
            });
        });

        it('should handle user with ADMIN role', () => {
            const user = {
                id: 'admin-id-789',
                name: 'Admin User',
                email: 'admin@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-07-01T00:00:00.000Z'),
            };

            const response: GetUserResponseDto = GetUserMapper.toResponse(user);

            expect(response).toEqual({
                id: 'admin-id-789',
                name: 'Admin User',
                email: 'admin@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-07-01T00:00:00.000Z'),
            });
        });

        it('should preserve date objects', () => {
            const createdAt = new Date('2023-03-15T14:30:00.000Z');
            const updatedAt = new Date('2023-03-20T09:15:00.000Z');

            const user = {
                id: 'user-id-999',
                name: 'Test User',
                email: 'test@example.com',
                role: UserRole.USER,
                createdAt,
                updatedAt,
            };

            const response: GetUserResponseDto = GetUserMapper.toResponse(user);

            expect(response.createdAt).toBeInstanceOf(Date);
            expect(response.updatedAt).toBeInstanceOf(Date);
            expect(response.createdAt).toEqual(createdAt);
            expect(response.updatedAt).toEqual(updatedAt);
        });
    });
});