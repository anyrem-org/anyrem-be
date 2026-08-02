import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  McpAuthUser,
  McpCurrentUser,
  McpGuard,
} from "../../common/auth/mcp.guard.js";
import { SearchService } from "./search.service.js";
import type { SearchParams } from "./search.types.js";

@Controller("mcp/search")
@UseGuards(McpGuard)
export class McpSearchController {
  constructor(private readonly search: SearchService) {}
  @Get("notes")
  notes(
    @McpCurrentUser() user: McpAuthUser,
    @Query("q") q = "",
    @Query() params: SearchParams,
  ) {
    return this.search.notes(user.id, q, params);
  }
}
