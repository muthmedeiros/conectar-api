import { plainToInstance } from 'class-transformer';
import { User } from '../../users/domain/user.model';
import { CreateUserAuthCommand } from '../commands/create-user-auth.command';
import { CreateUserAuthRequestDto } from '../dtos/create-user-auth.request.dto';
import { CreateUserAuthResponseDto } from '../dtos/create-user-auth.response.dto';

export class CreateUserMapper {
    static fromDto(dto: CreateUserAuthRequestDto): CreateUserAuthCommand {
        return {
            name: dto.name,
            email: dto.email,
            rawPassword: dto.password,
            role: dto.role,
        };
    }

    static toResponse(user: User): CreateUserAuthResponseDto {
        return plainToInstance(
            CreateUserAuthResponseDto,
            user,
            { excludeExtraneousValues: true },
        );
    }
}
