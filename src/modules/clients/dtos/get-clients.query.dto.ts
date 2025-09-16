import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClientStatus } from '../enums/client-status.enum';

export class GetClientsQueryDto {
    @ApiPropertyOptional({
        description: 'Search by name or CNPJ (partial match)',
        example: 'conectar'
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter clients by status',
        enum: ClientStatus,
        enumName: 'ClientStatus'
    })
    @IsEnum(ClientStatus)
    @IsOptional()
    status?: ClientStatus;

    @ApiPropertyOptional({
        description: 'Filter by conectarPlus status',
        examples: [true, false, 'true', 'false', '1', '0'],
    })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    conectarPlus?: boolean;

    @ApiPropertyOptional({
        description: 'Field to order by',
        enum: ['corporateReason', 'name', 'createdAt'],
        default: 'createdAt'
    })
    @IsEnum(['corporateReason', 'name', 'createdAt'])
    @IsOptional()
    orderBy?: 'corporateReason' | 'name' | 'createdAt' = 'createdAt';

    @ApiPropertyOptional({
        description: 'Order direction',
        enum: ['ASC', 'DESC'],
        default: 'DESC'
    })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    order?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        description: 'Page number (1-based)',
        minimum: 1,
        default: 1
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 20
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 20;
}