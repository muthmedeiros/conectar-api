import { ClientStatus } from '../enums/client-status.enum';

export type CreateClientCommand = {
    corporateReason: string;
    cnpj: string;
    name: string;
    status?: ClientStatus;
    conectarPlus?: boolean;
    adminUserId: string;
};