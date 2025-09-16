import { plainToInstance } from 'class-transformer';
import { CreateClientCommand } from '../commands/create-client.command';
import { Client } from '../domain/client.model';
import { CreateClientRequestDto } from '../dtos/create-client.request.dto';
import { CreateClientResponseDto } from '../dtos/create-client.response.dto';

export class CreateClientMapper {
    static fromDto(dto: CreateClientRequestDto): CreateClientCommand {
        return {
            corporateReason: dto.corporateReason,
            cnpj: dto.cnpj,
            name: dto.name,
            status: dto.status,
            conectarPlus: dto.conectarPlus,
            adminUserId: dto.adminUserId,
        };
    }

    static toResponse(client: Client): CreateClientResponseDto {
        return plainToInstance(
            CreateClientResponseDto,
            client,
            { excludeExtraneousValues: true },
        );
    }
}