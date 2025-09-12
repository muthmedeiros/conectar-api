import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../../modules/users/entities/user.entity';

export const getDatabaseConfig = async (
    configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
    type: 'sqlite',
    database: configService.get<string>('DB_NAME', 'conectar.db'),
    entities: [UserEntity],
    synchronize: true, // Used only for testing and development
});