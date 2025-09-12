import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { UserRole } from "src/common/enums/user-role.enum";
import { User } from "src/modules/users/domain/user.model";

export class CreateUserResponseDto implements User {
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

    @ApiProperty()
    @Expose()
    readonly createdAt: Date;

    @ApiProperty()
    @Expose()
    readonly updatedAt: Date;
}
