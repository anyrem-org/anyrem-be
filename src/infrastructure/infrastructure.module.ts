import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail/mail.service.js";
import { QueueService } from "./queue/queue.service.js";
import { MeiliService } from "./search/meili.service.js";
import { TelegramService } from "./telegram/telegram.service.js";
import { ObjectStorageService } from "./object-storage/object-storage.service.js";

@Global()
@Module({
  providers: [
    MailService,
    QueueService,
    MeiliService,
    TelegramService,
    ObjectStorageService,
  ],
  exports: [
    MailService,
    QueueService,
    MeiliService,
    TelegramService,
    ObjectStorageService,
  ],
})
export class InfrastructureModule {}
