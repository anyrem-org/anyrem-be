import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  McpAuthUser,
  McpCurrentUser,
  McpGuard,
} from "../../common/auth/mcp.guard.js";
import { SettingsService } from "./settings.service.js";

@Controller("mcp/settings")
@UseGuards(McpGuard)
export class McpSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(@McpCurrentUser() user: McpAuthUser) {
    return this.settings.all(user.id);
  }
}
