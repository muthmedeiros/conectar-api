import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserRequestDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    @Length(8)
    readonly password: string;

    @ApiProperty({ example: UserRole.USER, enum: UserRole, enumName: 'UserRole' })
    @IsEnum(UserRole, { message: `role must be one of: ${Object.values(UserRole).join(', ')}` })
    readonly role: UserRole;
}
