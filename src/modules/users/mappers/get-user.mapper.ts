import { plainToInstance } from 'class-transformer';
import { User } from '../domain/user.model';
import { GetUserResponseDto } from '../dtos/get-user.response.dto';
import { GetUsersResponseDto } from '../dtos/get-users.response.dto';

export class GetUserMapper {
    static toResponse(user: User): GetUserResponseDto {
        return plainToInstance(
            GetUserResponseDto,
            user,
            { excludeExtraneousValues: true },
        );
    }

    static toListResponse(users: User[]): GetUsersResponseDto[] {
        return users.map(user =>
            plainToInstance(
                GetUsersResponseDto,
                user,
                { excludeExtraneousValues: true },
            )
        );
    }
}