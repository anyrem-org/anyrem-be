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
  async list(@McpCurrentUser() user: McpAuthUser) {
    const { items } = await this.categories.list(user.id, {
      limit: Number.MAX_SAFE_INTEGER,
    });
    return items;
  }
}
