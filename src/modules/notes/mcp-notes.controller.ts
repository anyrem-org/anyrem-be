import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  McpAuthUser,
  McpCurrentUser,
  McpGuard,
} from "../../common/auth/mcp.guard.js";
import { BulkCreateNotesFromTemplateDto } from "./notes.dto.js";
import { NotesService } from "./notes.service.js";
import { listNoteTemplates } from "./notes.templates.js";

@Controller("mcp/notes")
@UseGuards(McpGuard)
export class McpNotesController {
  constructor(private readonly notes: NotesService) {}

  @Get("templates")
  getTemplates() {
    return { templates: listNoteTemplates() };
  }

  @Post("templates/bulk-create-from-template")
  bulkCreateNotesFromTemplate(
    @McpCurrentUser() user: McpAuthUser,
    @Body() body: BulkCreateNotesFromTemplateDto,
  ) {
    return this.notes.bulkCreateNotesFromTemplate(
      user.id,
      body.records,
      body.templateId,
    );
  }
}
