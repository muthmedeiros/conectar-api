import { Controller, Put, Body, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileUpdateRequestDto } from './dtos/profile-update.request.dto';
import { ProfileResponseDto } from './dtos/profile.response.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Put()
    @ApiOperation({ summary: 'Update own profile' })
    @ApiBody({ type: ProfileUpdateRequestDto })
    @ApiResponse({ status: 200, type: ProfileResponseDto })
    @ApiResponse({ status: 400, description: 'Current password is incorrect' })
    async updateProfile(
        @Body() dto: ProfileUpdateRequestDto,
        @Request() req: any
    ): Promise<ProfileResponseDto> {
        return this.profileService.updateProfile(req.user.id, dto);
    }
}
