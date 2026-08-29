import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { CATEGORY_SORTS, type CategorySort } from "./categories.types.js";

export class CategoryListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ default: 1 })
  page = 1;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  limit = 20;
  @IsString() @MaxLength(100) @IsOptional() @ApiPropertyOptional() q?: string;
  @IsIn(Object.values(CATEGORY_SORTS))
  @IsOptional()
  @ApiPropertyOptional({
    enum: Object.values(CATEGORY_SORTS),
    default: CATEGORY_SORTS.UPDATED_DESC,
  })
  sort?: CategorySort;
}

export class CategoryInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: "Electron" })
  name?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ example: "Desktop knowledge" })
  description?: string;
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  @ApiPropertyOptional({ example: "#6366f1", pattern: "^#[0-9a-fA-F]{6}$" })
  color?: string;
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @ApiPropertyOptional({ example: "Code2" })
  icon?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ default: true })
  showInGlobalSearch?: boolean;
}
