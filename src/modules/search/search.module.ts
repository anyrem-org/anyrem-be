import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module.js";
import { SearchController } from "./search.controller.js";
import { SearchService } from "./search.service.js";

@Module({ imports: [SettingsModule], controllers: [SearchController], providers: [SearchService] })
export class SearchModule {}
