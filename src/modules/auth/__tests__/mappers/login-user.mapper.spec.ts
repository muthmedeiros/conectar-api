import { LoginUserMapper } from "../../mappers/login-user.mapper";

describe('LoginUserMapper', () => {
    it('toResponse should map tokens correctly', () => {
        const tokens = { accessToken: 'a', refreshToken: 'b', expiresIn: 123 };
        const dto = LoginUserMapper.toResponse(tokens);
        expect(dto.accessToken).toBe('a');
        expect(dto.refreshToken).toBe('b');
        expect(dto.tokenType).toBe('Bearer');
    });
});
