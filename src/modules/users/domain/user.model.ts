import { UserRole } from "src/common/enums/user-role.enum";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}