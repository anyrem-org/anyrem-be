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
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  AuthGuard,
  AuthUser,
  CurrentUser,
} from "../../common/auth/auth.guard.js";
import {
  InboxInputDto,
  InboxListQueryDto,
  UpdateInboxInputDto,
} from "./inboxes.dto.js";
import { InboxesService } from "./inboxes.service.js";

@Controller("inboxes")
@UseGuards(AuthGuard)
@ApiTags("Inboxes")
@ApiBearerAuth()
export class InboxesController {
  constructor(private readonly inboxes: InboxesService) {}

  @Get() list(
    @CurrentUser() user: AuthUser,
    @Query() query: InboxListQueryDto,
  ) {
    return this.inboxes.list(user.id, query);
  }

  @Post() create(@CurrentUser() user: AuthUser, @Body() body: InboxInputDto) {
    return this.inboxes.create(user.id, body);
  }

  @Get(":id") get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.inboxes.get(user.id, id);
  }

  @Patch(":id") update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateInboxInputDto,
  ) {
    return this.inboxes.update(user.id, id, body);
  }

  @Delete(":id") remove(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.inboxes.remove(user.id, id);
  }

  @Post("switch-status-mark-inbox/:id") switchStatusMarkInbox(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.inboxes.switchStatusMarkInbox(user.id, id);
  }
}
