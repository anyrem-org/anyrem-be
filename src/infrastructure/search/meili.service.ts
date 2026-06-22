import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MeiliSearch } from "meilisearch";
import { SEARCH_INDEXES } from "../../common/constants/app.constants.js";

@Injectable()
export class MeiliService {
  readonly client: MeiliSearch;
  readonly notes;
  constructor(config: ConfigService) {
    this.client = new MeiliSearch({ host: config.getOrThrow("MEILI_HOST"), apiKey: config.getOrThrow("MEILI_MASTER_KEY") });
    this.notes = this.client.index(SEARCH_INDEXES.NOTES);
  }
  async configure() {
    await this.notes.updateFilterableAttributes(["userId", "categoryIds", "pinned", "createdAt", "updatedAt"]);
    await this.notes.updateSortableAttributes(["createdAt", "updatedAt"]);
    await this.notes.updateSearchableAttributes(["title", "titleNormalized", "categoryNames", "contentText", "contentNormalized"]);
  }
}
