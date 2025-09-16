import { UserMapper } from '../../users/mappers/user.mapper';
import { Client } from '../domain/client.model';
import { ClientEntity } from '../entities/client.entity';

export class ClientMapper {
    static toDomain(entity: ClientEntity): Client {
        const {
            id,
            corporateReason,
            cnpj,
            name,
            status,
            conectarPlus,
            adminUserId,
            adminUser,
            users,
            createdAt,
            updatedAt
        } = entity;

        return {
            id,
            corporateReason,
            cnpj,
            name,
            status,
            conectarPlus,
            adminUserId,
            adminUser: adminUser ? UserMapper.toDomain(adminUser) : undefined,
            users: users ? UserMapper.toDomainList(users) : undefined,
            createdAt,
            updatedAt
        };
    }

    static toDomainList(entities: ClientEntity[]): Client[] {
        return entities.map(entity => this.toDomain(entity));
    }

    static toEntity(client: Client): ClientEntity {
        const entity = new ClientEntity();
        entity.id = client.id;
        entity.corporateReason = client.corporateReason;
        entity.cnpj = client.cnpj;
        entity.name = client.name;
        entity.status = client.status;
        entity.conectarPlus = client.conectarPlus;
        entity.adminUserId = client.adminUserId;
        entity.createdAt = client.createdAt;
        entity.updatedAt = client.updatedAt;
        return entity;
    }
}