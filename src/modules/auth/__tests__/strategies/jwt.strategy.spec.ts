import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../strategies/jwt.strategy';

describe('JwtStrategy', () => {
    let configService: ConfigService;

    beforeEach(() => {
        configService = new ConfigService();
    });

    it('should validate payload', async () => {
        const strategy = new JwtStrategy(configService);
        const payload = { sub: '1', email: 'a', role: 'admin' };
        const result = await strategy.validate(payload);
        expect(result).toEqual({ id: '1', email: 'a', role: 'admin' });
    });
});
