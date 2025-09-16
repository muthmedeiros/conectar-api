import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ClientStatus } from '../enums/client-status.enum';

export class CreateClientRequestDto {
    @ApiProperty({ example: 'Conectar Tecnologia LTDA' })
    @IsString()
    @IsNotEmpty()
    readonly corporateReason: string;

    @ApiProperty({ example: '12.345.678/0001-90' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ must be in format XX.XXX.XXX/XXXX-XX' })
    readonly cnpj: string;

    @ApiProperty({ example: 'Conectar Tech' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: ClientStatus.ACTIVE, enum: ClientStatus, enumName: 'ClientStatus', required: false })
    @IsEnum(ClientStatus, { message: `status must be one of: ${Object.values(ClientStatus).join(', ')}` })
    @IsOptional()
    readonly status?: ClientStatus = ClientStatus.ACTIVE;

    @ApiProperty({ example: false, required: false })
    @IsBoolean()
    @IsOptional()
    readonly conectarPlus?: boolean = false;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID(4, { message: 'adminUserId must be a valid UUID' })
    readonly adminUserId: string;
}