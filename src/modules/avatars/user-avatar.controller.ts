import { BadRequestException, Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SelectAvatarDto } from "./avatars.dto.js";
import { AvatarsService } from "./avatars.service.js";

@Controller("users/me")
@UseGuards(AuthGuard)
@ApiTags("Avatars")
@ApiBearerAuth()
export class UserAvatarController {
  constructor(private readonly avatars: AvatarsService) {}
  @Patch("avatar") select(@CurrentUser() user: AuthUser, @Body() body: SelectAvatarDto) { if (!body.avatarId) throw new BadRequestException("avatarId is required"); return this.avatars.select(user.id, body.avatarId); }
}
