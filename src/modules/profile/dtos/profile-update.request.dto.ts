import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class ProfileUpdateRequestDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    readonly email?: string;

    @ApiProperty({ description: 'Current password', minLength: 8 })
    @IsString()
    @Length(8)
    readonly currentPassword: string;

    @ApiPropertyOptional({ description: 'New password', minLength: 8 })
    @IsString()
    @IsOptional()
    @Length(8)
    readonly newPassword?: string;
}
