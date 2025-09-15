import { plainToInstance } from 'class-transformer';
import { CreateUserCommand } from '../commands/create-user.command';
import { User } from '../domain/user.model';
import { CreateUserRequestDto } from '../dtos/create-user.request.dto';
import { CreateUserResponseDto } from '../dtos/create-user.response.dto';

export class CreateUserMapper {
    static fromDto(dto: CreateUserRequestDto): CreateUserCommand {
        return {
            name: dto.name,
            email: dto.email,
            rawPassword: dto.password,
            role: dto.role,
        };
    }

    static toResponse(user: User): CreateUserResponseDto {
        return plainToInstance(
            CreateUserResponseDto,
            user,
            { excludeExtraneousValues: true },
        );
    }
}