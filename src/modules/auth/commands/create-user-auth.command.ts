import { UserRole } from '../../../common/enums/user-role.enum';

export type CreateUserAuthCommand = {
  name: string;
  email: string;
  rawPassword: string;
  role: UserRole;
};
