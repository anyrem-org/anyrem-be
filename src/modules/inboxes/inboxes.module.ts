import { Module } from "@nestjs/common";
import { InboxesService } from "./inboxes.service.js";
import { InboxesController } from "./inboxes.controller.js";
import { SettingsModule } from "../settings/settings.module.js";

@Module({
  imports: [SettingsModule],
  providers: [InboxesService],
  controllers: [InboxesController],
})
export class InboxesModule {}
