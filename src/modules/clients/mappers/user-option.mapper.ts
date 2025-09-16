import { plainToInstance } from 'class-transformer';
import { User } from '../../users/domain/user.model';
import { UserOptionResponseDto } from '../dtos/user-option.response.dto';

export class UserOptionMapper {
    static toResponse(user: User): UserOptionResponseDto {
        const label = `${user.name} <${user.email}>`;
        return plainToInstance(
            UserOptionResponseDto,
            { ...user, label },
            { excludeExtraneousValues: true },
        );
    }

    static toListResponse(users: User[]): UserOptionResponseDto[] {
        return users.map(UserOptionMapper.toResponse);
    }
}
