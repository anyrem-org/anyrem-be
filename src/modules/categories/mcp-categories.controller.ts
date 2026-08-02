import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  McpAuthUser,
  McpCurrentUser,
  McpGuard,
} from "../../common/auth/mcp.guard.js";
import { CategoriesService } from "./categories.service.js";

@Controller("mcp/categories")
@UseGuards(McpGuard)
export class McpCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@McpCurrentUser() user: McpAuthUser) {
    return this.categories.list(user.id);
  }
}
