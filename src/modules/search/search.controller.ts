import { Controller, Delete, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service.js";
import type { SearchParams } from "./search.types.js";

@Controller("search")
@UseGuards(AuthGuard)
@ApiTags("Search")
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly search: SearchService) {}
  @Get("notes")
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "categoryId", required: false, format: "uuid" })
  @ApiQuery({ name: "pinned", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "sort", required: false, enum: ["relevance", "recent"] })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  notes(@CurrentUser() user: AuthUser, @Query("q") q = "", @Query() params: SearchParams) { return this.search.notes(user.id, q, params); }
  @Get("history") history(@CurrentUser() user: AuthUser) { return this.search.history(user.id); }
  @Delete("history") clear(@CurrentUser() user: AuthUser) { return this.search.clear(user.id); }
}
