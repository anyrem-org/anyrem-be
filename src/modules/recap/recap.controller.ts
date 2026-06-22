import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { NotificationProvider } from "@prisma/client";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TestRecapDto } from "./recap.dto.js";
import { RecapService } from "./recap.service.js";

@Controller("recaps")
@UseGuards(AuthGuard)
@ApiTags("Recaps")
@ApiBearerAuth()
export class RecapController {
  constructor(private readonly recaps: RecapService) {}
  @Get("today") today(@CurrentUser() user: AuthUser) { return this.recaps.today(user.id); }
  @Get("history") history(@CurrentUser() user: AuthUser) { return this.recaps.history(user.id); }
  @Post("test") test(@CurrentUser() user: AuthUser, @Body() body: TestRecapDto) { if (!Object.values(NotificationProvider).includes(body.provider)) throw new BadRequestException("Invalid provider"); return this.recaps.test(user.id, body.provider); }
  @Get(":id/deliveries") deliveries(@CurrentUser() user: AuthUser, @Param("id") id: string) { return this.recaps.deliveries(user.id, id); }
}
