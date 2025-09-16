import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ClientStatus } from '../enums/client-status.enum';

export class UpdateClientRequestDto {
    @ApiProperty({ example: 'Conectar Tecnologia LTDA', required: false })
    @IsString()
    @IsOptional()
    readonly corporateReason?: string;

    @ApiProperty({ example: '12.345.678/0001-90', required: false })
    @IsString()
    @IsOptional()
    @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ must be in format XX.XXX.XXX/XXXX-XX' })
    readonly cnpj?: string;

    @ApiProperty({ example: 'Conectar Tech', required: false })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ example: ClientStatus.ACTIVE, enum: ClientStatus, enumName: 'ClientStatus', required: false })
    @IsEnum(ClientStatus, { message: `status must be one of: ${Object.values(ClientStatus).join(', ')}` })
    @IsOptional()
    readonly status?: ClientStatus;

    @ApiProperty({ example: false, required: false })
    @IsBoolean()
    @IsOptional()
    readonly conectarPlus?: boolean;
}