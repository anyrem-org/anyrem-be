import { ApiProperty } from "@nestjs/swagger";
import { NotificationProvider } from "@prisma/client";
import { IsEnum } from "class-validator";
export class TestRecapDto { @IsEnum(NotificationProvider) @ApiProperty({ enum: NotificationProvider }) provider!: NotificationProvider; }
