import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = async (
    config: ConfigService,
): Promise<JwtModuleOptions> => ({
    secret: config.get<string>('JWT_SECRET', 'dev-secret'),
    signOptions: {
        expiresIn: config.get<string | number>('JWT_EXPIRES_IN', '1h'),
    },
});
