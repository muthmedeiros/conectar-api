import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class GetUsersQueryDto {
    @ApiPropertyOptional({
        description: 'Filter users by role',
        enum: UserRole,
        enumName: 'UserRole'
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Search by name or email (partial match)',
        example: 'john'
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Field to order by',
        enum: ['name', 'createdAt'],
        default: 'createdAt'
    })
    @IsEnum(['name', 'createdAt'])
    @IsOptional()
    orderBy?: 'name' | 'createdAt' = 'createdAt';

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