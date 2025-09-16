import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from "../../users/domain/user.model";

export class CreateUserAuthResponseDto implements User {
    @ApiProperty()
    @Expose()
    readonly id: string;

    @ApiProperty()
    @Expose()
    readonly name: string;

    @ApiProperty()
    @Expose()
    readonly email: string;

    @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
    @Expose()
    readonly role: UserRole;

    @ApiProperty({ type: Date, nullable: true })
    @Expose()
    readonly lastLogin: Date | null;

    @ApiProperty()
    @Expose()
    readonly createdAt: Date;

    @ApiProperty()
    @Expose()
    readonly updatedAt: Date;
}
