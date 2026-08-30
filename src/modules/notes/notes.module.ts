import { Module } from "@nestjs/common";
import { UploadsModule } from "../uploads/uploads.module.js";
import { McpNotesController } from "./mcp-notes.controller.js";
import { NotesController } from "./notes.controller.js";
import { NotesService } from "./notes.service.js";

@Module({
  imports: [UploadsModule],
  controllers: [NotesController, McpNotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
