import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GetClientResponseDto } from './get-client.response.dto';

export class PaginatedClientsResponseDto {
    @ApiProperty({ type: [GetClientResponseDto] })
    @Expose()
    readonly clients: GetClientResponseDto[];

    @ApiProperty({ example: 1 })
    @Expose()
    readonly page: number;

    @ApiProperty({ example: 20 })
    @Expose()
    readonly limit: number;

    @ApiProperty({ example: 100 })
    @Expose()
    readonly total: number;

    @ApiProperty({ example: 5 })
    @Expose()
    readonly totalPages: number;

    @ApiProperty({ example: true })
    @Expose()
    readonly hasNextPage: boolean;

    @ApiProperty({ example: false })
    @Expose()
    readonly hasPreviousPage: boolean;
}