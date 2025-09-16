import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserOptionResponseDto {
    @ApiProperty({ description: 'User ID' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'User name' })
    @Expose()
    name: string;
}
