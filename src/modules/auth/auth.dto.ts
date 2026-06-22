import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsEmail() @ApiProperty({ example: "demo@example.com" }) email!: string;
  @IsString()
  @MinLength(10)
  @ApiProperty({ example: "demo-password-123", minLength: 10 })
  password!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @ApiProperty({ example: "Demo User" })
  name!: string;
}
export class EmailDto {
  @IsEmail() @ApiProperty({ example: "demo@example.com" }) email!: string;
}
export class TokenDto {
  @IsString() @MinLength(1) @ApiProperty() token!: string;
}
export class LoginDto extends EmailDto {
  @IsString() @ApiProperty({ example: "demo-password-123" }) password!: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Swagger" })
  deviceName?: string;
}
export class RefreshTokenDto {
  @IsString() @MinLength(1) @ApiProperty() refreshToken!: string;
}
export class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(10)
  @ApiProperty({ example: "new-password-123", minLength: 10 })
  password!: string;
}
export class GoogleExchangeDto {
  @IsString() @MinLength(1) @ApiProperty() code!: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Desktop" })
  deviceName?: string;
}
