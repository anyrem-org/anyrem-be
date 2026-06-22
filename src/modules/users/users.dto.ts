import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
export class UpdateUserDto { @IsString() @MinLength(1) @MaxLength(120) @ApiProperty({ example: "Demo User" }) name!: string; }
