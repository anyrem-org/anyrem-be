import { Injectable } from "@nestjs/common";
import { ActivityType } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";

const noteInclude = {
  categories: { include: { category: true } },
  relationsLeft: { select: { rightNoteId: true } },
  relationsRight: { select: { leftNoteId: true } },
} as const;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async recent(userId: string) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const [events, todayCount] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where: { userId, note: { deletedAt: null } },
        include: { note: { include: noteInclude } },
        orderBy: { occurredAt: "desc" },
        take: 12,
      }),
      this.prisma.activityEvent.count({
        where: { userId, occurredAt: { gte: dayStart } },
      }),
    ]);
    return {
      todayCount,
      items: events
        .map((event) => ({
          id: event.id.toString(),
          type: event.type,
          occurredAt: event.occurredAt,
          note: event.note,
        })),
    };
  }
}

export { ActivityType };
