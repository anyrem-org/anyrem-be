import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { UploadImageDto } from "./uploads.dto.js";
import { UploadsService } from "./uploads.service.js";

@Controller("uploads")
@UseGuards(AuthGuard)
@ApiTags("Uploads")
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("images")
  image(@CurrentUser() user: AuthUser, @Body() body: UploadImageDto) {
    return this.uploads.image(user.id, body.dataUrl, body.name);
  }
}
