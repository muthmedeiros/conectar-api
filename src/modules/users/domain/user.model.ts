import { UserRole } from "../../../common/enums/user-role.enum";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}