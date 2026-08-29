import { describe, expect, it } from "vitest";
import {
  globalSearchVisibilityWhere,
  isShownInGlobalSearch,
} from "../src/modules/search/search.visibility.js";

describe("search.visibility", () => {
  it("returns false when the note is hidden", () => {
    expect(
      isShownInGlobalSearch({
        showInGlobalSearch: false,
        categories: [{ category: { showInGlobalSearch: true } }],
      }),
    ).toBe(false);
  });

  it("returns false when any category is hidden", () => {
    expect(
      isShownInGlobalSearch({
        showInGlobalSearch: true,
        categories: [
          { category: { showInGlobalSearch: true } },
          { category: { showInGlobalSearch: false } },
        ],
      }),
    ).toBe(false);
  });

  it("builds prisma filters for global search", () => {
    expect(globalSearchVisibilityWhere()).toEqual({
      showInGlobalSearch: true,
      categories: { every: { category: { showInGlobalSearch: true } } },
    });
  });
});
