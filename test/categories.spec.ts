import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { CategoriesService } from "../src/modules/categories/categories.service.js";

describe("CategoriesService.remove", () => {
  it("rejects deletion while a memory uses the category", async () => {
    const prisma = {
      category: { findFirst: vi.fn().mockResolvedValue({ id: "category-id" }), delete: vi.fn() },
      noteCategory: { count: vi.fn().mockResolvedValue(2) },
    };
    const service = new CategoriesService(prisma as never);

    await expect(service.remove("user-id", "category-id")).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});
