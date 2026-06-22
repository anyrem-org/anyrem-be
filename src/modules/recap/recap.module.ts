import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module.js";
import { RecapController } from "./recap.controller.js";
import { RecapService } from "./recap.service.js";

@Module({ imports: [SettingsModule], controllers: [RecapController], providers: [RecapService], exports: [RecapService] })
export class RecapModule {}
