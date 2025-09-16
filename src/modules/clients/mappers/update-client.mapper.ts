import { plainToInstance } from 'class-transformer';
import { UpdateClientCommand } from '../commands/update-client.command';
import { Client } from '../domain/client.model';
import { UpdateClientRequestDto } from '../dtos/update-client.request.dto';
import { UpdateClientResponseDto } from '../dtos/update-client.response.dto';

export class UpdateClientMapper {
    static fromDto(id: string, dto: UpdateClientRequestDto): UpdateClientCommand {
        return {
            id,
            corporateReason: dto.corporateReason,
            cnpj: dto.cnpj,
            name: dto.name,
            status: dto.status,
            conectarPlus: dto.conectarPlus,
        };
    }

    static toResponse(client: Client): UpdateClientResponseDto {
        return plainToInstance(
            UpdateClientResponseDto,
            client,
            { excludeExtraneousValues: true },
        );
    }
}