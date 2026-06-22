import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CategoryInputDto {
  @IsOptional() @IsString() @MaxLength(100) @ApiPropertyOptional({ example: "Electron" }) name?: string;
  @IsOptional() @IsString() @MaxLength(500) @ApiPropertyOptional({ example: "Desktop knowledge" }) description?: string;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/) @ApiPropertyOptional({ example: "#6366f1", pattern: "^#[0-9a-fA-F]{6}$" }) color?: string;
  @IsOptional() @IsString() @MaxLength(40) @ApiPropertyOptional({ example: "Code2" }) icon?: string;
}
