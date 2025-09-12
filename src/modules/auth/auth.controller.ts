
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserRequestDto } from './dtos/create-user.request.dto';
import { CreateUserResponseDto } from './dtos/create-user.response.dto';
import { LoginUserRequestDto } from './dtos/login-user.request.dto';
import { LoginUserResponseDto } from './dtos/login-user.response.dto';
import { CreateUserMapper } from './mappers/create-user.mapper';
import { LoginUserMapper } from './mappers/login-user.mapper';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user', description: 'Accessible publicly, creates a new account.' })
    @ApiBody({ type: CreateUserRequestDto })
    @ApiResponse({ status: 201, type: CreateUserResponseDto })
    @ApiResponse({ status: 409, description: 'Email already in use' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    async register(@Body() dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
        const requestCmd = CreateUserMapper.fromDto(dto);

        const createdUser = await this.authService.register(requestCmd);

        const response = CreateUserMapper.toResponse(createdUser);

        return response;
    }

    @Post('login')
    @ApiOperation({ summary: 'Login a user', description: 'Accessible publicly, logs in a user and returns a JWT token.' })
    @ApiBody({ type: LoginUserRequestDto })
    @ApiResponse({ status: 201, type: LoginUserResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginUserRequestDto): Promise<LoginUserResponseDto> {
        const user = await this.authService.login(dto.email, dto.password);

        const response = LoginUserMapper.toResponse(user);

        return response;
    }
}
