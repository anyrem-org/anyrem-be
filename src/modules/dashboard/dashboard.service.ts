import { Injectable } from "@nestjs/common";
import {
  SETTING_KEYS,
  SETTING_TYPES,
} from "../../common/constants/settings.constants.js";
import { localDateInfo } from "../../common/date/timezone.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import { SettingsService } from "../settings/settings.service.js";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}
  async get(userId: string) {
    const timezone = await this.settings.value<string>(
      userId,
      SETTING_TYPES.REGIONAL,
      SETTING_KEYS.REGIONAL.TIMEZONE,
    );
    const day = localDateInfo(new Date(), timezone);
    const weekStart = new Date(day.start.getTime() - 6 * 86_400_000);
    const [today, continuing, activityEvents, categories, recap] =
      await Promise.all([
        this.prisma.note.findMany({
          where: {
            userId,
            deletedAt: null,
            createdAt: { gte: day.start, lt: day.end },
          },
          include: dashboardNoteInclude,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.note.findFirst({
          where: { userId, deletedAt: null, lastOpenedAt: { not: null } },
          include: dashboardNoteInclude,
          orderBy: { lastOpenedAt: "desc" },
        }),
        this.prisma.activityEvent.findMany({
          where: { userId, note: { deletedAt: null } },
          include: { note: { include: dashboardNoteInclude } },
          orderBy: { occurredAt: "desc" },
          take: 24,
        }),
        this.prisma.category.findMany({
          where: { userId },
          include: {
            notes: {
              where: {
                note: { createdAt: { gte: weekStart }, deletedAt: null },
              },
            },
          },
        }),
        this.prisma.dailySummary.findUnique({
          where: { userId_localDate: { userId, localDate: day.dbDate } },
        }),
      ]);
    const seenNoteIds = new Set<string>();
    const activities = activityEvents
      .filter((event) => {
        if (seenNoteIds.has(event.noteId)) return false;
        seenNoteIds.add(event.noteId);
        return true;
      })
      .slice(0, 6);
    return {
      today,
      continue: continuing,
      recentlyActive: activities,
      topCategories: categories
        .map((x) => ({
          id: x.id,
          name: x.name,
          color: x.color,
          icon: x.icon,
          count: x.notes.length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recapPreview: recap ?? { localDate: day.key, noteCount: today.length },
    };
  }
  async graph(userId: string) {
    const [categories, notes] = await Promise.all([
      this.prisma.category.findMany({
        where: { userId },
        include: { _count: { select: { notes: true } } },
      }),
      this.prisma.note.findMany({
        where: { userId, deletedAt: null },
        include: {
          categories: { include: { category: true } },
          relationsLeft: true,
          relationsRight: true,
        },
      }),
    ]);
    return {
      categories: categories.map((x) => ({
        id: x.id,
        name: x.name,
        description: x.description ?? "",
        color: x.color,
        icon: x.icon,
        noteCount: x._count.notes,
      })),
      notes: notes.map((x) => ({
        id: x.id,
        title: x.title,
        content: x.contentText,
        category: x.categories[0]?.category.name ?? "Uncategorized",
        categoryColor: x.categories[0]?.category.color ?? "#64748b",
        categoryIds: x.categories.map((c) => c.categoryId),
        relatedIds: [
          ...x.relationsLeft.map((r) => r.rightNoteId),
          ...x.relationsRight.map((r) => r.leftNoteId),
        ],
        updatedAt: x.updatedAt,
      })),
      edges: [
        ...notes.flatMap((x) =>
          x.categories.map((c) => ({
            id: `contains-${c.categoryId}-${x.id}`,
            source: `category-${c.categoryId}`,
            target: `note-${x.id}`,
            type: "contains",
          })),
        ),
        ...notes.flatMap((x) =>
          x.relationsLeft.map((r) => ({
            id: `related-${r.id}`,
            source: `note-${r.leftNoteId}`,
            target: `note-${r.rightNoteId}`,
            type: "related",
          })),
        ),
      ],
    };
  }
}

const dashboardNoteInclude = {
  categories: { include: { category: true } },
  relationsLeft: { select: { rightNoteId: true } },
  relationsRight: { select: { leftNoteId: true } },
} as const;
