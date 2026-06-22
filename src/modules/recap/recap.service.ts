import { BadRequestException, Injectable } from "@nestjs/common";
import {
  DeliveryStatus,
  NotificationProvider,
  Prisma,
  UserStatus,
} from "@prisma/client";
import { JOB_NAMES } from "../../common/constants/app.constants.js";
import {
  SETTING_KEYS,
  SETTING_TYPES,
} from "../../common/constants/settings.constants.js";
import { localDateInfo } from "../../common/date/timezone.js";
import { MailService } from "../../infrastructure/mail/mail.service.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import { QueueService } from "../../infrastructure/queue/queue.service.js";
import { TelegramService } from "../../infrastructure/telegram/telegram.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { escapeHtml, maskEmail, renderSummary } from "./recap.helpers.js";
import type { SummaryPayload } from "./recap.types.js";

@Injectable()
export class RecapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly queue: QueueService,
    private readonly mail: MailService,
    private readonly telegram: TelegramService,
  ) {}
  async generate(userId: string, now = new Date()) {
    const timezone = await this.settings.value<string>(
      userId,
      SETTING_TYPES.REGIONAL,
      SETTING_KEYS.REGIONAL.TIMEZONE,
    );
    const day = localDateInfo(now, timezone);
    const existing = await this.prisma.dailySummary.findUnique({
      where: { userId_localDate: { userId, localDate: day.dbDate } },
    });
    if (existing) return existing;
    const notes = await this.prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { createdAt: { gte: day.start, lt: day.end } },
          { updatedAt: { gte: day.start, lt: day.end } },
        ],
      },
      include: { categories: { include: { category: true } } },
      orderBy: { updatedAt: "asc" },
    });
    const groups = new Map<string, string[]>();
    for (const note of notes) {
      const names = note.categories.length
        ? note.categories.map((x) => x.category.name)
        : ["Uncategorized"];
      for (const name of names)
        (groups.get(name) ?? (groups.set(name, []), groups.get(name)!)).push(
          note.title,
        );
    }
    const payload: SummaryPayload = {
      date: day.key,
      groups: [...groups].map(([category, titles]) => ({ category, titles })),
    };
    return this.prisma.dailySummary.create({
      data: {
        userId,
        localDate: day.dbDate,
        timezone,
        contentJson: payload as unknown as Prisma.InputJsonValue,
        contentText: renderSummary(payload),
        noteCount: notes.length,
      },
    });
  }
  async enqueueDue(now = new Date()) {
    const users = await this.prisma.user.findMany({
      where: { status: UserStatus.ACTIVE, deletedAt: null },
    });
    for (const user of users) {
      if (
        !(await this.settings.value<boolean>(
          user.id,
          SETTING_TYPES.RECAP,
          SETTING_KEYS.RECAP.ENABLED,
        ))
      )
        continue;
      const timezone = await this.settings.value<string>(
        user.id,
        SETTING_TYPES.REGIONAL,
        SETTING_KEYS.REGIONAL.TIMEZONE,
      );
      const deliveryTime = await this.settings.value<string>(
        user.id,
        SETTING_TYPES.RECAP,
        SETTING_KEYS.RECAP.DELIVERY_TIME,
      );
      if (localDateInfo(now, timezone).localTime !== deliveryTime) continue;
      const summary = await this.generate(user.id, now);
      const providers: NotificationProvider[] = [];
      if (
        user.emailVerifiedAt &&
        (await this.settings.value<boolean>(
          user.id,
          SETTING_TYPES.RECAP,
          SETTING_KEYS.RECAP.EMAIL_ENABLED,
        ))
      )
        providers.push(NotificationProvider.EMAIL);
      if (
        await this.settings.value<boolean>(
          user.id,
          SETTING_TYPES.RECAP,
          SETTING_KEYS.RECAP.TELEGRAM_ENABLED,
        )
      )
        providers.push(NotificationProvider.TELEGRAM);
      for (const provider of providers) {
        const recipientMasked =
          provider === NotificationProvider.EMAIL
            ? maskEmail(user.email)
            : "telegram";
        const delivery = await this.prisma.notificationDelivery.upsert({
          where: {
            dailySummaryId_provider: { dailySummaryId: summary.id, provider },
          },
          create: {
            dailySummaryId: summary.id,
            userId: user.id,
            provider,
            recipientMasked,
          },
          update: {},
        });
        if (delivery.status !== DeliveryStatus.SENT)
          await this.queue.recap.add(
            provider === NotificationProvider.EMAIL
              ? JOB_NAMES.SEND_EMAIL
              : JOB_NAMES.SEND_TELEGRAM,
            { deliveryId: delivery.id.toString() },
            {
              jobId: `delivery-${delivery.id}`,
              attempts: 4,
              backoff: { type: "exponential", delay: 30_000 },
              removeOnComplete: 100,
              removeOnFail: 100,
            },
          );
      }
    }
  }
  async deliver(deliveryId: bigint) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      include: { summary: true, user: true },
    });
    if (!delivery || delivery.status === DeliveryStatus.SENT) return;
    try {
      if (delivery.provider === NotificationProvider.EMAIL) {
        if (!delivery.user.emailVerifiedAt)
          throw new Error("Email is not verified");
        const payload = delivery.summary
          .contentJson as unknown as SummaryPayload;
        const html = `<h1>Daily recap ${escapeHtml(payload.date)}</h1>${payload.groups.map((g) => `<h2>${escapeHtml(g.category)}</h2><ul>${g.titles.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`).join("")}`;
        await this.mail.send(
          delivery.user.email,
          `Remember Anything — Daily recap ${payload.date}`,
          delivery.summary.contentText,
          html,
        );
      } else {
        const token = await this.settings.secret(
          delivery.userId,
          SETTING_KEYS.TELEGRAM.BOT_TOKEN,
        );
        const chatId = await this.settings.secret(
          delivery.userId,
          SETTING_KEYS.TELEGRAM.CHAT_ID,
        );
        if (!token || !chatId) throw new Error("Telegram is not configured");
        await this.telegram.sendMessage(
          token,
          chatId,
          delivery.summary.contentText,
        );
      }
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.SENT,
          sentAt: new Date(),
          attemptCount: { increment: 1 },
          errorMessage: null,
        },
      });
    } catch (error) {
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          attemptCount: { increment: 1 },
          errorMessage:
            error instanceof Error
              ? error.message.slice(0, 2000)
              : "Unknown delivery error",
        },
      });
      throw error;
    }
  }
  async test(userId: string, provider: NotificationProvider) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const summary = await this.generate(userId);
    if (provider === NotificationProvider.EMAIL) {
      if (!user.emailVerifiedAt)
        throw new BadRequestException("Email is not verified");
      await this.mail.send(
        user.email,
        "Remember Anything — Test recap",
        summary.contentText,
      );
    } else {
      const token = await this.settings.secret(
        userId,
        SETTING_KEYS.TELEGRAM.BOT_TOKEN,
      );
      const chatId = await this.settings.secret(
        userId,
        SETTING_KEYS.TELEGRAM.CHAT_ID,
      );
      if (!token || !chatId)
        throw new BadRequestException("Telegram is not configured");
      await this.telegram.sendMessage(token, chatId, summary.contentText);
    }
    return { sent: true, provider };
  }
  today(userId: string) {
    return this.generate(userId);
  }
  history(userId: string) {
    return this.prisma.dailySummary.findMany({
      where: { userId },
      include: { deliveries: true },
      orderBy: { localDate: "desc" },
      take: 30,
    });
  }
  deliveries(userId: string, id: string) {
    return this.prisma.notificationDelivery.findMany({
      where: { userId, dailySummaryId: id },
      orderBy: { createdAt: "desc" },
    });
  }
}
