import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionUtil } from '../../common/utils/encryption.util';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ProfileUpdateRequestDto } from './dtos/profile-update.request.dto';
import { ProfileResponseDto } from './dtos/profile.response.dto';

@Injectable()
export class ProfileService {
    constructor(
        private readonly usersService: UsersService,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    ) { }

    async updateProfile(userId: string, dto: ProfileUpdateRequestDto): Promise<ProfileResponseDto> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        // Check current password
        const isMatch = await EncryptionUtil.comparePassword(dto.currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Update fields if provided
        if (dto.name !== undefined) user.name = dto.name;
        if (dto.email !== undefined) user.email = dto.email;
        if (dto.newPassword !== undefined) {
            user.passwordHash = await EncryptionUtil.hashPassword(dto.newPassword);
        }

        const updatedUser = await this.userRepository.save(user);
        return {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        };
    }
}
