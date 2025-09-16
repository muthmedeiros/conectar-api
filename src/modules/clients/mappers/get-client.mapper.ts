import { plainToInstance } from 'class-transformer';
import { GetUserMapper } from '../../users/mappers/get-user.mapper';
import { Client } from '../domain/client.model';
import { GetClientResponseDto } from '../dtos/get-client.response.dto';

export class GetClientMapper {
    static toResponse(client: Client): GetClientResponseDto {
        const response = plainToInstance(
            GetClientResponseDto,
            client,
            { excludeExtraneousValues: true },
        );

        if (client.adminUser) {
            (response as any).adminUser = GetUserMapper.toResponse(client.adminUser);
        }

        if (client.users) {
            (response as any).users = client.users.map(user => GetUserMapper.toResponse(user));
        }

        return response;
    }

    static toResponseList(clients: Client[]): GetClientResponseDto[] {
        return clients.map(client => this.toResponse(client));
    }
}