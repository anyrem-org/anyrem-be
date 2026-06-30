import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  SETTING_KEYS,
  SETTING_TYPES,
} from "../../common/constants/settings.constants.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import { MeiliService } from "../../infrastructure/search/meili.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { normalizeSearch } from "./search.helpers.js";
import type { SearchParams } from "./search.types.js";

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeiliService,
    private readonly settings: SettingsService,
  ) {}
  async notes(userId: string, query: string, params: SearchParams) {
    const page = Math.max(Number(params.page ?? 1), 1),
      limit = Math.min(Math.max(Number(params.limit ?? 20), 1), 100);
    const from = params.from ? new Date(params.from) : undefined;
    const to = params.to ? new Date(params.to) : undefined;
    if (from && Number.isNaN(from.getTime()))
      throw new BadRequestException("Invalid from date");
    if (to && Number.isNaN(to.getTime()))
      throw new BadRequestException("Invalid to date");
    if (!query.trim() && params.pinned === "true") {
      const where: Prisma.NoteWhereInput = {
        userId,
        deletedAt: null,
        pinned: true,
        categories: params.categoryId
          ? { some: { categoryId: params.categoryId } }
          : undefined,
        createdAt: from || to ? { gte: from, lte: to } : undefined,
      };
      const [items, total] = await this.prisma.$transaction([
        this.prisma.note.findMany({
          where,
          include: { categories: { include: { category: true } } },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.note.count({ where }),
      ]);
      return {
        items: items.map((note) => ({
          id: note.id,
          userId: note.userId,
          title: note.title,
          contentText: note.contentText,
          categoryIds: note.categories.map((x) => x.categoryId),
          categoryNames: note.categories.map((x) => x.category.name),
          pinned: note.pinned,
          createdAt: Math.floor(note.createdAt.getTime() / 1000),
          updatedAt: Math.floor(note.updatedAt.getTime() / 1000),
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }
    const filters = [`userId = "${userId}"`];
    if (params.categoryId)
      filters.push(
        `categoryIds = "${params.categoryId.replace(/[^a-f0-9-]/gi, "")}"`,
      );
    if (params.pinned === "true") filters.push("pinned = true");
    if (from) filters.push(`createdAt >= ${Math.floor(from.getTime() / 1000)}`);
    if (to) filters.push(`createdAt <= ${Math.floor(to.getTime() / 1000)}`);
    const result = await this.meili.notes.search(query, {
      filter: filters,
      sort: params.sort === "recent" ? ["updatedAt:desc"] : undefined,
      offset: (page - 1) * limit,
      limit,
      attributesToHighlight: ["title", "contentText"],
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",
    });
    if (
      query.trim() &&
      (await this.settings.value<boolean>(
        userId,
        SETTING_TYPES.SEARCH,
        SETTING_KEYS.SEARCH.SAVE_HISTORY,
      ))
    ) {
      const normalized = normalizeSearch(query.trim());
      await this.prisma.searchHistory.upsert({
        where: {
          userId_keywordNormalized: { userId, keywordNormalized: normalized },
        },
        create: {
          userId,
          keyword: query.trim(),
          keywordNormalized: normalized,
        },
        update: {
          keyword: query.trim(),
          searchCount: { increment: 1 },
          lastSearchedAt: new Date(),
        },
      });
    }
    const total = result.estimatedTotalHits ?? result.hits.length;
    return {
      items: result.hits,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
  history(userId: string) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { lastSearchedAt: "desc" },
      take: 20,
    });
  }
  clear(userId: string) {
    return this.prisma.searchHistory
      .deleteMany({ where: { userId } })
      .then(() => ({ deleted: true }));
  }
}
