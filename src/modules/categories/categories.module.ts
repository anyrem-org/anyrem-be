import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller.js";
import { CategoriesService } from "./categories.service.js";
import { NotesModule } from "../notes/notes.module.js";

@Module({ imports: [NotesModule], controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
