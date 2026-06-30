import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActivityType, NoteRelationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import { QueueService } from "../../infrastructure/queue/queue.service.js";
import { UploadsService } from "../uploads/uploads.service.js";
import { htmlOf, imagePathsOf, textOf, unique } from "./notes.helpers.js";
import {
  NOTE_SORTS,
  type NoteInput,
  type NoteListQuery,
} from "./notes.types.js";

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly uploads: UploadsService,
  ) {}
  private include = {
    categories: { include: { category: true } },
    relationsLeft: true,
    relationsRight: true,
  } as const;
  private async validateLinks(
    userId: string,
    categoryIds: string[],
    relatedIds: string[],
    currentId?: string,
  ) {
    if (
      categoryIds.length !==
      (await this.prisma.category.count({
        where: { userId, id: { in: categoryIds } },
      }))
    )
      throw new BadRequestException("Invalid category");
    const filtered = relatedIds.filter((id) => id !== currentId);
    if (
      filtered.length !==
      (await this.prisma.note.count({
        where: { userId, id: { in: filtered }, deletedAt: null },
      }))
    )
      throw new BadRequestException("Invalid related note");
    return filtered;
  }

  async list(userId: string, query: NoteListQuery = {}, categoryId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NoteWhereInput = {
      userId,
      deletedAt: null,
      pinned: query.pinned,
      createdAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
      categories:
        categoryId || query.categoryId
          ? {
              some: { categoryId: categoryId ?? query.categoryId },
            }
          : undefined,
      OR: query.q?.trim()
        ? [
            { title: { contains: query.q.trim(), mode: "insensitive" } },
            { contentText: { contains: query.q.trim(), mode: "insensitive" } },
          ]
        : undefined,
    };
    const orderBy: Prisma.NoteOrderByWithRelationInput =
      query.sort === NOTE_SORTS.CREATED_DESC
        ? { createdAt: "desc" }
        : query.sort === NOTE_SORTS.TITLE_ASC
          ? { title: "asc" }
          : { updatedAt: "desc" };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: this.include,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.note.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }
  async get(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
      include: this.include,
    });

    if (!note) throw new NotFoundException();

    return note;
  }
  async create(userId: string, input: NoteInput) {
    if (!input.title?.trim() || !input.contentJson) {
      throw new BadRequestException("title and contentJson are required");
    }

    const categoryIds = unique(input.categoryIds);
    const relatedIds = await this.validateLinks(
      userId,
      categoryIds,
      unique(input.relatedIds),
    );

    const note = await this.prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          user: { connect: { id: userId } },
          title: input.title!.trim(),
          contentJson: input.contentJson as Prisma.InputJsonValue,
          contentText: textOf(input.contentJson!).trim(),
          contentHtml: htmlOf(input.contentJson!),
          pinned: input.pinned ?? false,
        },
      });

      if (categoryIds.length)
        await tx.noteCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            userId,
            noteId: note.id,
            categoryId,
          })),
        });

      if (relatedIds.length)
        await tx.noteRelation.createMany({
          data: relatedIds.map((id) => ({
            userId,
            leftNoteId: note.id < id ? note.id : id,
            rightNoteId: note.id < id ? id : note.id,
            type: NoteRelationType.MANUAL,
          })),
          skipDuplicates: true,
        });

      await tx.activityEvent.create({
        data: { userId, noteId: note.id, type: ActivityType.CREATED },
      });

      return note;
    });

    await this.uploads.syncNoteImages(userId, note.id, imagePathsOf(input.contentJson));
    await this.queue.indexNote(note.id);

    return this.get(userId, note.id);
  }

  async update(userId: string, id: string, input: NoteInput) {
    await this.get(userId, id);
    const categoryIds = unique(input.categoryIds);
    const relatedIds = await this.validateLinks(
      userId,
      categoryIds,
      unique(input.relatedIds),
      id,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.note.update({
        where: { id },
        data: {
          title: input.title?.trim(),
          contentJson: input.contentJson as Prisma.InputJsonValue | undefined,
          contentText: input.contentJson
            ? textOf(input.contentJson).trim()
            : undefined,
          contentHtml: input.contentJson
            ? htmlOf(input.contentJson)
            : undefined,
          pinned: input.pinned,
        },
      });
      if (input.categoryIds) {
        await tx.noteCategory.deleteMany({ where: { noteId: id } });
        await tx.noteCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            userId,
            noteId: id,
            categoryId,
          })),
        });
      }
      if (input.relatedIds) {
        await tx.noteRelation.deleteMany({
          where: {
            userId,
            type: NoteRelationType.MANUAL,
            OR: [{ leftNoteId: id }, { rightNoteId: id }],
          },
        });
        await tx.noteRelation.createMany({
          data: relatedIds.map((other) => ({
            userId,
            leftNoteId: id < other ? id : other,
            rightNoteId: id < other ? other : id,
            type: NoteRelationType.MANUAL,
          })),
          skipDuplicates: true,
        });
      }
      await tx.activityEvent.create({
        data: { userId, noteId: id, type: ActivityType.EDITED },
      });
    });
    if (input.contentJson)
      await this.uploads.syncNoteImages(userId, id, imagePathsOf(input.contentJson));
    await this.queue.indexNote(id);
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.uploads.markNoteImagesDeleted(userId, id);
    await this.queue.deleteNote(id);
    return { deleted: true };
  }

  async open(userId: string, id: string) {
    await this.get(userId, id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.note.update({ where: { id }, data: { lastOpenedAt: now } }),
      this.prisma.activityEvent.create({
        data: {
          userId,
          noteId: id,
          type: ActivityType.VIEWED,
          occurredAt: now,
        },
      }),
    ]);
    return { openedAt: now };
  }

  async pin(userId: string, id: string, pinned: boolean) {
    await this.get(userId, id);
    await this.prisma.$transaction([
      this.prisma.note.update({ where: { id }, data: { pinned } }),
      this.prisma.activityEvent.create({
        data: {
          userId,
          noteId: id,
          type: pinned ? ActivityType.PINNED : ActivityType.UNPINNED,
        },
      }),
    ]);
    await this.queue.indexNote(id);
    return { pinned };
  }

  async related(userId: string, id: string) {
    await this.get(userId, id);
    const relations = await this.prisma.noteRelation.findMany({
      where: { userId, OR: [{ leftNoteId: id }, { rightNoteId: id }] },
    });
    const ids = relations.map((x) =>
      x.leftNoteId === id ? x.rightNoteId : x.leftNoteId,
    );
    return this.prisma.note.findMany({
      where: { userId, id: { in: ids }, deletedAt: null },
    });
  }
}
