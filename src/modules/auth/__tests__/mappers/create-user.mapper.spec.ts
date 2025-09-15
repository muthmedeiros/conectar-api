import { CreateUserAuthRequestDto } from "../../dtos/create-user-auth.request.dto";
import { CreateUserMapper } from "../../mappers/create-user.mapper";

describe('CreateUserMapper', () => {
    it('fromDto should map correctly', () => {
        const dto = { name: 'a', email: 'b', password: 'c', role: 'user' } as CreateUserAuthRequestDto;
        const cmd = CreateUserMapper.fromDto(dto);
        expect(cmd.rawPassword).toBe('c');
    });

    it('toResponse should exclude password', () => {
        const user = { id: '1', name: 'a', email: 'b', role: 'user', createdAt: new Date(), updatedAt: new Date() };
        const response = CreateUserMapper.toResponse(user as any);
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('name');
        expect(response).toHaveProperty('email');
        expect(response).toHaveProperty('role');
        expect(response).toHaveProperty('createdAt');
        expect(response).toHaveProperty('updatedAt');
        expect(response).not.toHaveProperty('passwordHash');
    });
});
