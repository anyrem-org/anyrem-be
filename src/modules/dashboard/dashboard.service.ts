import { Injectable } from "@nestjs/common";
import { SETTING_KEYS, SETTING_TYPES } from "../../common/constants/settings.constants.js";
import { localDateInfo } from "../../common/date/timezone.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import { SettingsService } from "../settings/settings.service.js";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly settings: SettingsService) {}
  async get(userId: string) {
    const timezone = await this.settings.value<string>(userId, SETTING_TYPES.REGIONAL, SETTING_KEYS.REGIONAL.TIMEZONE); const day = localDateInfo(new Date(), timezone); const weekStart = new Date(day.start.getTime() - 6 * 86_400_000);
    const [today, continuing, activities, categories, recap] = await Promise.all([this.prisma.note.findMany({ where: { userId, deletedAt: null, createdAt: { gte: day.start, lt: day.end } }, include: { categories: { include: { category: true } } }, orderBy: { createdAt: "desc" } }), this.prisma.note.findFirst({ where: { userId, deletedAt: null, lastOpenedAt: { not: null } }, orderBy: { lastOpenedAt: "desc" } }), this.prisma.activityEvent.findMany({ where: { userId }, include: { note: { select: { id: true, title: true } } }, orderBy: { occurredAt: "desc" }, take: 12 }), this.prisma.category.findMany({ where: { userId }, include: { notes: { where: { note: { createdAt: { gte: weekStart }, deletedAt: null } } } } }), this.prisma.dailySummary.findUnique({ where: { userId_localDate: { userId, localDate: day.dbDate } } })]);
    return { today, continue: continuing, recentlyActive: activities, topCategories: categories.map((x) => ({ id: x.id, name: x.name, color: x.color, count: x.notes.length })).sort((a, b) => b.count - a.count).slice(0, 5), recapPreview: recap ?? { localDate: day.key, noteCount: today.length } };
  }
  async graph(userId: string) { const [categories, notes, relations] = await Promise.all([this.prisma.category.findMany({ where: { userId } }), this.prisma.note.findMany({ where: { userId, deletedAt: null }, include: { categories: true } }), this.prisma.noteRelation.findMany({ where: { userId } })]); return { nodes: [...categories.map((x) => ({ id: `category-${x.id}`, type: "category", label: x.name, color: x.color })), ...notes.map((x) => ({ id: `note-${x.id}`, type: "note", label: x.title }))], edges: [...notes.flatMap((x) => x.categories.map((c) => ({ id: `contains-${c.categoryId}-${x.id}`, source: `category-${c.categoryId}`, target: `note-${x.id}`, type: "contains" }))), ...relations.map((x) => ({ id: `related-${x.id}`, source: `note-${x.leftNoteId}`, target: `note-${x.rightNoteId}`, type: "related" }))] }; }
}
