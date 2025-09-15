import { CreateUserRequestDto } from '../../dtos/create-user.request.dto';
import { CreateUserMapper } from '../../mappers/create-user.mapper';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('CreateUserMapper', () => {
    describe('fromDto', () => {
        it('should map DTO to command correctly', () => {
            const dto: CreateUserRequestDto = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: UserRole.USER,
            };

            const command = CreateUserMapper.fromDto(dto);

            expect(command).toEqual({
                name: 'John Doe',
                email: 'john@example.com',
                rawPassword: 'password123',
                role: UserRole.USER,
            });
        });
    });

    describe('toResponse', () => {
        it('should map user domain to response DTO', () => {
            const user = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
            };

            const response = CreateUserMapper.toResponse(user);

            expect(response).toEqual({
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
            });
        });

        it('should exclude sensitive fields like passwordHash', () => {
            const user = {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: UserRole.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
                passwordHash: 'should-not-appear', // This should be excluded
            } as any;

            const response = CreateUserMapper.toResponse(user);

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