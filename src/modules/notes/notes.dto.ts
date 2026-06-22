import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { NOTE_SORTS, type DocNode, type NoteSort } from "./notes.types.js";

export class NoteListQueryDto {
  @Type(() => Number) @IsInt() @Min(1) @IsOptional() @ApiPropertyOptional({ default: 1 }) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) @IsOptional() @ApiPropertyOptional({ default: 20, maximum: 100 }) limit = 20;
  @IsString() @MaxLength(300) @IsOptional() @ApiPropertyOptional() q?: string;
  @IsUUID("4") @IsOptional() @ApiPropertyOptional({ format: "uuid" }) categoryId?: string;
  @Transform(({ value }) => value === "true" ? true : value === "false" ? false : value)
  @IsBoolean() @IsOptional() @ApiPropertyOptional({ type: Boolean }) pinned?: boolean;
  @IsDateString() @IsOptional() @ApiPropertyOptional({ format: "date-time" }) from?: string;
  @IsDateString() @IsOptional() @ApiPropertyOptional({ format: "date-time" }) to?: string;
  @IsIn(Object.values(NOTE_SORTS)) @IsOptional() @ApiPropertyOptional({ enum: Object.values(NOTE_SORTS), default: NOTE_SORTS.UPDATED_DESC }) sort?: NoteSort;
}

export class NoteInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @ApiPropertyOptional({ example: "Electron offline-first" }) title?: string;
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    example: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Memory content" }],
        },
      ],
    },
  })
  contentJson?: DocNode;
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ApiPropertyOptional({ type: [String], format: "uuid" })
  categoryIds?: string[];
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ApiPropertyOptional({ type: [String], format: "uuid" })
  relatedIds?: string[];
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional() pinned?: boolean;
}
export class PinNoteDto {
  @IsBoolean()
  @ApiProperty() pinned!: boolean;
}
