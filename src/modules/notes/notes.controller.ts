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
import {
  AuthGuard,
  CurrentUser,
  type AuthUser,
} from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NoteInputDto, NoteListQueryDto, PinNoteDto } from "./notes.dto.js";
import { NotesService } from "./notes.service.js";
import type { NoteInput } from "./notes.types.js";

@Controller("notes")
@UseGuards(AuthGuard)
@ApiTags("Notes")
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notes: NotesService) {}
  @Get() list(@CurrentUser() user: AuthUser, @Query() query: NoteListQueryDto) {
    return this.notes.list(user.id, query);
  }
  @Post() create(@CurrentUser() user: AuthUser, @Body() body: NoteInputDto) {
    return this.notes.create(user.id, body);
  }
  @Get(":id") get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notes.get(user.id, id);
  }
  @Patch(":id") update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: NoteInputDto,
  ) {
    return this.notes.update(user.id, id, body);
  }
  @Delete(":id") remove(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.notes.remove(user.id, id);
  }
  @Post(":id/open") open(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.notes.open(user.id, id);
  }
  @Patch(":id/pin") pin(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: PinNoteDto,
  ) {
    return this.notes.pin(user.id, id, body.pinned);
  }
  @Get(":id/related") related(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.notes.related(user.id, id);
  }
}
