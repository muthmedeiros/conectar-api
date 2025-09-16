import { User } from '../../users/domain/user.model';
import { ClientStatus } from '../enums/client-status.enum';

export interface Client {
    id: string;
    corporateReason: string;
    cnpj: string;
    name: string;
    status: ClientStatus;
    conectarPlus: boolean;
    adminUserId: string;
    adminUser?: User;
    users?: User[];
    createdAt: Date;
    updatedAt: Date;
}