import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import {
  CATEGORY_SORTS,
  type CategoryInput,
  type CategoryListQuery,
  type CategorySort,
} from "./categories.types.js";

const validColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string, query: CategoryListQuery = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const q = query.q?.trim();
    const rows = await this.prisma.category.findMany({
      where: {
        userId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { notes: { where: { note: { deletedAt: null } } } },
        },
      },
    });
    const items = rows.sort((left, right) =>
      this.compare(left, right, query.sort ?? CATEGORY_SORTS.UPDATED_DESC),
    );
    const total = items.length;

    return {
      items: items.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
  private compare(
    left: { updatedAt: Date; name: string; _count: { notes: number } },
    right: { updatedAt: Date; name: string; _count: { notes: number } },
    sort: CategorySort,
  ) {
    const direction = sort.endsWith("_asc") ? 1 : -1;
    const value = sort.startsWith("note_count")
      ? left._count.notes - right._count.notes
      : left.updatedAt.getTime() - right.updatedAt.getTime();
    return value === 0
      ? left.name.localeCompare(right.name)
      : value * direction;
  }
  async get(userId: string, id: string) {
    const row = await this.prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { notes: { where: { note: { deletedAt: null } } } },
        },
      },
    });
    if (!row) throw new NotFoundException();
    return row;
  }
  async create(userId: string, input: CategoryInput) {
    if (!input.name?.trim() || !input.color || !validColor(input.color))
      throw new BadRequestException("Valid name and color are required");
    return this.prisma.category.create({
      data: {
        userId,
        name: input.name.trim(),
        description: input.description?.trim(),
        color: input.color,
        icon: input.icon,
      },
    });
  }
  async update(userId: string, id: string, input: CategoryInput) {
    const row = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException();
    if (input.color && !validColor(input.color))
      throw new BadRequestException("Invalid color");
    return this.prisma.category.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: input.description?.trim(),
        color: input.color,
        icon: input.icon,
      },
    });
  }
  async remove(userId: string, id: string) {
    const [category, usageCount] = await Promise.all([
      this.prisma.category.findFirst({
        where: { id, userId },
        select: { id: true },
      }),
      this.prisma.noteCategory.count({ where: { categoryId: id, userId } }),
    ]);

    if (!category) {
      throw new NotFoundException();
    }

    if (usageCount) {
      throw new ConflictException(
        `Category is used by ${usageCount} ${usageCount === 1 ? "memory" : "memories"}. Remove it from those memories first.`,
      );
    }

    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "Category is in use and cannot be deleted.",
        );
      }

      throw error;
    }

    return { deleted: true };
  }
}
