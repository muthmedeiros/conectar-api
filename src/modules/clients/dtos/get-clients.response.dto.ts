import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GetClientResponseDto } from './get-client.response.dto';

export class GetClientsResponseDto {
    @ApiProperty({ type: [GetClientResponseDto] })
    @Expose()
    readonly clients: GetClientResponseDto[];
}