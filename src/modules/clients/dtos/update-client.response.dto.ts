import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ClientStatus } from '../enums/client-status.enum';

export class UpdateClientResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @Expose()
    readonly id: string;

    @ApiProperty({ example: 'Conectar Tecnologia LTDA' })
    @Expose()
    readonly corporateReason: string;

    @ApiProperty({ example: '12.345.678/0001-90' })
    @Expose()
    readonly cnpj: string;

    @ApiProperty({ example: 'Conectar Tech' })
    @Expose()
    readonly name: string;

    @ApiProperty({ example: ClientStatus.ACTIVE, enum: ClientStatus })
    @Expose()
    readonly status: ClientStatus;

    @ApiProperty({ example: false })
    @Expose()
    readonly conectarPlus: boolean;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @Expose()
    readonly adminUserId: string;

    @ApiProperty({ example: '2023-09-15T10:00:00.000Z' })
    @Expose()
    readonly createdAt: Date;

    @ApiProperty({ example: '2023-09-15T10:00:00.000Z' })
    @Expose()
    readonly updatedAt: Date;
}