import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDefined, IsString, ValidateNested } from "class-validator";

export class SettingItemDto {
  @IsString() @ApiProperty({ example: "appearance" }) type!: string;
  @IsString() @ApiProperty({ example: "theme" }) key!: string;
  @IsDefined() @ApiProperty({ example: "DARK" }) value!: unknown;
}
export class UpdateSettingsDto { @IsArray() @ValidateNested({ each: true }) @Type(() => SettingItemDto) @ApiProperty({ type: [SettingItemDto] }) settings!: SettingItemDto[]; }
export class TelegramConfigDto { @IsString() @ApiProperty() botToken!: string; @IsString() @ApiProperty() chatId!: string; }
