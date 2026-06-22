import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
export class SelectAvatarDto { @IsUUID("4") @ApiProperty({ format: "uuid" }) avatarId!: string; }
