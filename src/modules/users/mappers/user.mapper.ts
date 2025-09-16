import { User } from '../domain/user.model';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
    static toDomain(entity: UserEntity): User {
        const { id, name, email, role, lastLogin, createdAt, updatedAt } = entity;
        return { id, name, email, role, lastLogin, createdAt, updatedAt };
    }

    static toDomainList(entities: UserEntity[]): User[] {
        return entities.map(entity => this.toDomain(entity));
    }

    static toEntity(user: User): UserEntity {
        const entity = new UserEntity();
        entity.id = user.id;
        entity.name = user.name;
        entity.email = user.email;
        entity.role = user.role;
        entity.lastLogin = user.lastLogin;
        entity.createdAt = user.createdAt;
        entity.updatedAt = user.updatedAt;
        return entity;
    }
}
