import { ClientStatus } from '../enums/client-status.enum';

export type UpdateClientCommand = {
    id: string;
    corporateReason?: string;
    cnpj?: string;
    name?: string;
    status?: ClientStatus;
    conectarPlus?: boolean;
};