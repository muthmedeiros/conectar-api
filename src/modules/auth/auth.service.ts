
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { EncryptionUtil } from 'src/common/utils/encryption.util';
import { Repository } from 'typeorm';
import { User } from '../users/domain/user.model';
import { UserEntity } from '../users/entities/user.entity';
import { UserMapper } from '../users/mappers/user.mapper';
import { CreateUserAuthCommand } from './commands/create-user-auth.command';
import { AuthTokens } from './interfaces/auth-tokens.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    async register(cmd: CreateUserAuthCommand): Promise<User> {
        const exists = await this.userRepository.exists({ where: { email: cmd.email } });
        if (exists) throw new ConflictException('Email already in use');

        const passwordHash = await EncryptionUtil.hashPassword(cmd.rawPassword);

        const userEntity = this.userRepository.create({
            name: cmd.name,
            email: cmd.email,
            passwordHash,
            role: cmd.role,
        });

        const savedUser = await this.userRepository.save(userEntity);
        return UserMapper.toDomain(savedUser);
    }

    async login(email: string, rawPassword: string): Promise<AuthTokens> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const passwordMatches = await EncryptionUtil.comparePassword(rawPassword, user.passwordHash);
        if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
            expiresIn: '7d',
        });

        const decoded: any = this.jwtService.decode(accessToken);
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = decoded?.exp ? decoded.exp - now : 900;

        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }
}
