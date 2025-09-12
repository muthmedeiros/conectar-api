import { UserRole } from 'src/common/enums/user-role.enum';

export type CreateUserCommand = {
  name: string;
  email: string;
  rawPassword: string;
  role: UserRole;
};
