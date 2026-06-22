import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiConflictResponse, ApiTags } from "@nestjs/swagger";
import {
  AuthGuard,
  CurrentUser,
  type AuthUser,
} from "../../common/auth/auth.guard.js";
import { CategoryInputDto } from "./categories.dto.js";
import { CategoriesService } from "./categories.service.js";
import { NoteListQueryDto } from "../notes/notes.dto.js";
import { NotesService } from "../notes/notes.service.js";

@Controller("categories")
@UseGuards(AuthGuard)
@ApiTags("Categories")
@ApiBearerAuth()
export class CategoriesController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly notes: NotesService,
  ) {}
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.categories.list(user.id);
  }
  @Get(":id") get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.categories.get(user.id, id);
  }
  @Get(":id/notes")
  async notesList(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query() query: NoteListQueryDto,
  ) {
    await this.categories.get(user.id, id);
    return this.notes.list(user.id, query, id);
  }
  @Post() create(
    @CurrentUser() user: AuthUser,
    @Body() body: CategoryInputDto,
  ) {
    return this.categories.create(user.id, body);
  }
  @Patch(":id") update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: CategoryInputDto,
  ) {
    return this.categories.update(user.id, id, body);
  }
  @Delete(":id")
  @ApiConflictResponse({ description: "Category is still used by one or more memories." })
  remove(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.categories.remove(user.id, id);
  }
}
