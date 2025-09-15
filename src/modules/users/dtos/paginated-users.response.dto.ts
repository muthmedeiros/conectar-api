import { ApiProperty } from '@nestjs/swagger';
import { GetUsersResponseDto } from './get-users.response.dto';

export class PaginatedUsersResponseDto {
    @ApiProperty({ type: [GetUsersResponseDto] })
    data: GetUsersResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;

    @ApiProperty()
    hasNext: boolean;

    @ApiProperty()
    hasPrev: boolean;
}