import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UpdateUserDto } from "./users.dto.js";
import { UsersService } from "./users.service.js";

@Controller("users/me")
@UseGuards(AuthGuard)
@ApiTags("Users")
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() me(@CurrentUser() user: AuthUser) { return this.users.me(user.id); }
  @Patch() update(@CurrentUser() user: AuthUser, @Body() body: UpdateUserDto) { return this.users.update(user.id, body.name); }
}
