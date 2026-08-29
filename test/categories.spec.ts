import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { CategoriesService } from "../src/modules/categories/categories.service.js";

describe("CategoriesService.remove", () => {
  it("rejects deletion while a memory uses the category", async () => {
    const prisma = {
      category: {
        findFirst: vi.fn().mockResolvedValue({ id: "category-id" }),
        delete: vi.fn(),
      },
      noteCategory: { count: vi.fn().mockResolvedValue(2) },
    };
    const queue = { reindexCategoryNotes: vi.fn() };
    const service = new CategoriesService(prisma as never, queue as never);

    await expect(
      service.remove("user-id", "category-id"),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});

describe("CategoriesService.list", () => {
  it("filters, sorts and paginates categories", async () => {
    const prisma = {
      category: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "first",
            name: "Electron",
            updatedAt: new Date("2026-01-01"),
            _count: { notes: 1 },
          },
          {
            id: "second",
            name: "Desktop",
            updatedAt: new Date("2026-01-02"),
            _count: { notes: 3 },
          },
        ]),
      },
    };
    const queue = { reindexCategoryNotes: vi.fn() };
    const service = new CategoriesService(prisma as never, queue as never);

    await expect(
      service.list("user-id", { q: "desk", sort: "note_count_desc", limit: 1 }),
    ).resolves.toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
      items: [{ id: "second" }],
    });
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-id",
          OR: expect.arrayContaining([
            expect.objectContaining({
              name: { contains: "desk", mode: "insensitive" },
            }),
          ]),
        }),
      }),
    );
  });
});
