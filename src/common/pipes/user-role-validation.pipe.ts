import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UserRoleValidationPipe implements PipeTransform {
    transform(value: any) {
        const roles = Object.values(UserRole);

        if (typeof value !== 'string' || !roles.includes(value as UserRole)) {
            throw new BadRequestException(
                `Invalid role: ${value}. Allowed roles: ${roles.join(', ')}`,
            );
        }

        return value as UserRole;
    }
}
