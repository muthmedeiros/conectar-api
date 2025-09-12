import { UserEntity } from '../entities/user.entity';
import { User } from '../domain/user.model';

export class UserMapper {
    static toDomain(entity: UserEntity): User {
        const { id, name, email, role, createdAt, updatedAt } = entity;
        return { id, name, email, role, createdAt, updatedAt };
    }
}
