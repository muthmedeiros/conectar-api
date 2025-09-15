import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserMapper } from './mappers/create-user.mapper';
import { GetUserMapper } from './mappers/get-user.mapper';
import { UpdateUserMapper } from './mappers/update-user.mapper';
import { UserMapper } from './mappers/user.mapper';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [UsersController],
    providers: [
        UsersService,
        CreateUserMapper,
        UpdateUserMapper,
        GetUserMapper,
        UserMapper,
    ],
    exports: [TypeOrmModule, UsersService],
})
export class UsersModule { }
