import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [ProfileController],
    providers: [UsersService, ProfileService],
    exports: [],
})
export class ProfileModule { }
