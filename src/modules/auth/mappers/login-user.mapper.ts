import { plainToInstance } from 'class-transformer';
import { LoginUserResponseDto } from '../dtos/login-user.response.dto';
import { AuthTokens } from '../interfaces/auth-tokens.interface';

export class LoginUserMapper {
    static toResponse(tokens: AuthTokens): LoginUserResponseDto {
        return plainToInstance(
            LoginUserResponseDto,
            tokens,
            { excludeExtraneousValues: true },
        );
    }
}
