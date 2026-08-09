import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import {
  InboxInputDto,
  InboxListQueryDto,
  UpdateInboxInputDto,
} from "./inboxes.dto.js";
import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import {
  SETTING_KEYS,
  SETTING_TYPES,
} from "../../common/constants/settings.constants.js";
import { SettingsService } from "../settings/settings.service.js";
import {
  DATE_FILTER_ALL,
  DATE_FILTER_THIS_MONTH,
  DATE_FILTER_THIS_WEEK,
  DATE_FILTER_THIS_YEAR,
  DATE_FILTER_TODAY,
} from "./inboxes.constants.js";

@Injectable()
export class InboxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async list(userId: string, query: InboxListQueryDto) {
    const where: Prisma.InboxWhereInput = {
      userId: userId,
    };

    where.AND = [{ completedAt: null }];

    if (query.completed) {
      where.AND = [];
    }

    if (query.date && query.date !== DATE_FILTER_ALL) {
      const timezone = await this.settings.value<string>(
        userId,
        SETTING_TYPES.REGIONAL,
        SETTING_KEYS.REGIONAL.TIMEZONE,
      );

      const { start, end } = this.getDateRangeForDateFilter(
        query.date,
        timezone,
      );

      where.createdAt = {
        gte: start.toUTC().toJSDate(),
        lt: end.toUTC().toJSDate(),
      };
    }

    return this.prisma.inbox.findMany({
      where,
      orderBy: [
        { completedAt: { sort: "desc", nulls: "first" } },
        { createdAt: "desc" },
      ],
    });
  }

  private getDateRangeForDateFilter(dateFilter: string, timezone: string) {
    const now = DateTime.now().setZone(timezone);

    let start = now;
    let end = now;

    if (dateFilter === DATE_FILTER_TODAY) {
      start = now.startOf("day");
      end = start.plus({ days: 1 });
    } else if (dateFilter === DATE_FILTER_THIS_WEEK) {
      start = now.startOf("week");
      end = start.plus({ weeks: 1 });
    } else if (dateFilter === DATE_FILTER_THIS_MONTH) {
      start = now.startOf("month");
      end = start.plus({ months: 1 });
    } else if (dateFilter === DATE_FILTER_THIS_YEAR) {
      start = now.startOf("year");
      end = start.plus({ years: 1 });
    }

    return { start, end };
  }

  async create(userId: string, input: InboxInputDto) {
    const inbox = await this.prisma.$transaction(async (prisma) => {
      const inbox = await prisma.inbox.create({
        data: {
          name: input.name,
          userId,
        },
      });

      return inbox;
    });

    // insert activity event later

    return this.get(userId, inbox.id);
  }

  async update(userId: string, id: string, input: UpdateInboxInputDto) {
    await this.get(userId, id);

    await this.prisma.$transaction(async (prisma) => {
      await prisma.inbox.update({
        where: { id },
        data: {
          name: input.name?.trim(),
        },
      });
    });

    return this.get(userId, id);
  }

  async get(userId: string, id: string) {
    const inbox = await this.prisma.inbox.findFirst({
      where: { id, userId },
    });

    if (!inbox) throw new NotFoundException();

    return inbox;
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);

    await this.prisma.inbox.delete({
      where: {
        id: id,
      },
    });

    return {
      deleted: true,
    };
  }

  async switchStatusMarkInbox(userId: string, id: string) {
    const inbox = await this.get(userId, id);

    await this.prisma.inbox.update({
      where: {
        id,
      },
      data: {
        completedAt: inbox.completedAt ? null : new Date(),
      },
    });

    return {
      switched: true,
    };
  }
}
