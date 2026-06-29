import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  AuthGuard,
  CurrentUser,
  type AuthUser,
} from "../../common/auth/auth.guard.js";
import { ActivityService } from "./activity.service.js";

@Controller("activity")
@UseGuards(AuthGuard)
@ApiTags("Activity")
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get("recent")
  recent(@CurrentUser() user: AuthUser) {
    return this.activity.recent(user.id);
  }
}
