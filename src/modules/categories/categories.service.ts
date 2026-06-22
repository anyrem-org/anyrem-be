import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import type { CategoryInput } from "./categories.types.js";

const validColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { notes: { where: { note: { deletedAt: null } } } },
        },
      },
      orderBy: { name: "asc" },
    });
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
