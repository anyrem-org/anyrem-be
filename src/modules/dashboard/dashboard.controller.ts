import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service.js";

@Controller()
@UseGuards(AuthGuard)
@ApiTags("Dashboard")
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get("dashboard") get(@CurrentUser() user: AuthUser) { return this.dashboard.get(user.id); }
  @Get("graph") graph(@CurrentUser() user: AuthUser) { return this.dashboard.graph(user.id); }
}
