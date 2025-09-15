import { UserRole } from '../../../common/enums/user-role.enum';

export type UpdateUserCommand = {
  id: string;
  name?: string;
  email?: string;
  rawPassword?: string;
  role?: UserRole;
};