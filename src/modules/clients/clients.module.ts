import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientEntity } from './entities/client.entity';
import { ClientMapper } from './mappers/client.mapper';
import { CreateClientMapper } from './mappers/create-client.mapper';
import { GetClientMapper } from './mappers/get-client.mapper';
import { UpdateClientMapper } from './mappers/update-client.mapper';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [TypeOrmModule.forFeature([ClientEntity, UserEntity]), UsersModule],
    controllers: [ClientsController],
    providers: [
        ClientsService,
        ClientMapper,
        CreateClientMapper,
        GetClientMapper,
        UpdateClientMapper,
    ],
    exports: [TypeOrmModule, ClientsService],
})
export class ClientsModule { }