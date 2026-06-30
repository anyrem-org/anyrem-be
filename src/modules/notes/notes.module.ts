import { Module } from "@nestjs/common";
import { UploadsModule } from "../uploads/uploads.module.js";
import { NotesController } from "./notes.controller.js";
import { NotesService } from "./notes.service.js";

@Module({ imports: [UploadsModule], controllers: [NotesController], providers: [NotesService], exports: [NotesService] })
export class NotesModule {}
