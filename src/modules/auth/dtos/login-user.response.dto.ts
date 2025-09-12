import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";

export class LoginUserResponseDto {
    @ApiProperty()
    @Expose()
    readonly accessToken: string;

    @ApiProperty()
    @Expose()
    readonly refreshToken: string;

    @ApiProperty()
    @Expose()
    readonly expiresIn: number;

    @ApiProperty({ example: 'Bearer' })
    @Expose()
    @Transform(() => 'Bearer')
    readonly tokenType: string;
}
