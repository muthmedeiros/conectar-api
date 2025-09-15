import { UpdateUserRequestDto } from '../../dtos/update-user.request.dto';
import { UpdateUserMapper } from '../../mappers/update-user.mapper';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('UpdateUserMapper', () => {
    describe('fromDto', () => {
        it('should map DTO to command with all fields', () => {
            const dto: UpdateUserRequestDto = {
                name: 'John Updated',
                email: 'john.updated@example.com',
                password: 'newpassword123',
                role: UserRole.ADMIN,
            };

            const command = UpdateUserMapper.fromDto(dto, 'user-id-123');

            expect(command).toEqual({
                id: 'user-id-123',
                name: 'John Updated',
                email: 'john.updated@example.com',
                rawPassword: 'newpassword123',
                role: UserRole.ADMIN,
            });
        });

        it('should map DTO to command with partial fields', () => {
            const dto: UpdateUserRequestDto = {
                name: 'John Updated',
            };

            const command = UpdateUserMapper.fromDto(dto, 'user-id-123');

            expect(command).toEqual({
                id: 'user-id-123',
                name: 'John Updated',
                email: undefined,
                rawPassword: undefined,
                role: undefined,
            });
        });

        it('should map DTO to command with empty fields', () => {
            const dto: UpdateUserRequestDto = {};

            const command = UpdateUserMapper.fromDto(dto, 'user-id-123');

            expect(command).toEqual({
                id: 'user-id-123',
                name: undefined,
                email: undefined,
                rawPassword: undefined,
                role: undefined,
            });
        });
    });

    describe('toResponse', () => {
        it('should map user domain to response DTO', () => {
            const user = {
                id: 'user-id-123',
                name: 'John Updated',
                email: 'john.updated@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
            };

            const response = UpdateUserMapper.toResponse(user);

            expect(response).toEqual({
                id: 'user-id-123',
                name: 'John Updated',
                email: 'john.updated@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
            });
        });

        it('should exclude sensitive fields like passwordHash', () => {
            const user = {
                id: 'user-id-123',
                name: 'John Updated',
                email: 'john.updated@example.com',
                role: UserRole.ADMIN,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
                passwordHash: 'should-not-appear', // This should be excluded
            } as any;

            const response = UpdateUserMapper.toResponse(user);

            expect(response).not.toHaveProperty('passwordHash');
            expect(response).toHaveProperty('id');
            expect(response).toHaveProperty('name');
            expect(response).toHaveProperty('email');
            expect(response).toHaveProperty('role');
            expect(response).toHaveProperty('createdAt');
            expect(response).toHaveProperty('updatedAt');
        });
    });
});