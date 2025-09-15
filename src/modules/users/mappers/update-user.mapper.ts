import { plainToInstance } from 'class-transformer';
import { UpdateUserCommand } from '../commands/update-user.command';
import { User } from '../domain/user.model';
import { UpdateUserRequestDto } from '../dtos/update-user.request.dto';
import { UpdateUserResponseDto } from '../dtos/update-user.response.dto';

export class UpdateUserMapper {
    static fromDto(dto: UpdateUserRequestDto, id: string): UpdateUserCommand {
        return {
            id,
            name: dto.name,
            email: dto.email,
            rawPassword: dto.password,
            role: dto.role,
        };
    }

    static toResponse(user: User): UpdateUserResponseDto {
        return plainToInstance(
            UpdateUserResponseDto,
            user,
            { excludeExtraneousValues: true },
        );
    }
}