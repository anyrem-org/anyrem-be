import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength } from "class-validator";

export class UploadImageDto {
  @IsString()
  @Matches(/^data:image\/(png|jpeg|webp|gif);base64,/)
  @ApiProperty()
  dataUrl!: string;

  @IsString()
  @MaxLength(160)
  @ApiProperty()
  name!: string;
}
