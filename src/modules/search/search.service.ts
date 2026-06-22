import { BadRequestException, Injectable } from "@nestjs/common";
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
    const filters = [`userId = "${userId}"`];
    if (params.categoryId)
      filters.push(
        `categoryIds = "${params.categoryId.replace(/[^a-f0-9-]/gi, "")}"`,
      );
    if (params.pinned === "true") filters.push("pinned = true");
    if (params.from) {
      const value = new Date(params.from);
      if (Number.isNaN(value.getTime()))
        throw new BadRequestException("Invalid from date");
      filters.push(`createdAt >= ${Math.floor(value.getTime() / 1000)}`);
    }
    if (params.to) {
      const value = new Date(params.to);
      if (Number.isNaN(value.getTime()))
        throw new BadRequestException("Invalid to date");
      filters.push(`createdAt <= ${Math.floor(value.getTime() / 1000)}`);
    }
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
