import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UserEntity } from '../../src/modules/users/entities/user.entity';
import { UsersModule } from '../../src/modules/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [UserEntity],
            synchronize: true,
        }),
        UsersModule,
        AuthModule,
    ],
})
export class TestingAppModule { }
