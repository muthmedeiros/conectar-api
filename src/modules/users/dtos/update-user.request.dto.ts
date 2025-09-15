import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserRequestDto {
    @ApiPropertyOptional({ example: 'John Doe Updated' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiPropertyOptional({ example: 'john.updated@example.com' })
    @IsEmail()
    @IsOptional()
    readonly email?: string;

    @ApiPropertyOptional({ example: 'newpassword123' })
    @IsString()
    @IsOptional()
    @Length(8)
    readonly password?: string;

    @ApiPropertyOptional({ example: UserRole.ADMIN, enum: UserRole, enumName: 'UserRole' })
    @IsEnum(UserRole, { message: `role must be one of: ${Object.values(UserRole).join(', ')}` })
    @IsOptional()
    readonly role?: UserRole;
}