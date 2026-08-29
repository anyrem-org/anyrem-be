import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Worker } from "bullmq";
import { JOB_NAMES, QUEUE_NAMES } from "./common/constants/app.constants.js";
import { normalizeSearch } from "./modules/search/search.helpers.js";
import { isShownInGlobalSearch } from "./modules/search/search.visibility.js";
import { MeiliService } from "./infrastructure/search/meili.service.js";
import { PrismaService } from "./infrastructure/prisma/prisma.module.js";
import { QueueService } from "./infrastructure/queue/queue.service.js";
import { RecapService } from "./modules/recap/recap.service.js";
import { UploadsService } from "./modules/uploads/uploads.service.js";

@Injectable()
export class WorkerRuntime implements OnApplicationShutdown {
  private workers: Worker[] = [];
  private timer?: NodeJS.Timeout;
  private lastCleanup = 0;
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
    private readonly meili: MeiliService,
    private readonly recaps: RecapService,
    private readonly uploads: UploadsService,
  ) {}
  async start() {
    await this.meili.configure();
    this.workers.push(
      new Worker(
        QUEUE_NAMES.SEARCH,
        async (job) => {
          if (job.name === JOB_NAMES.DELETE_NOTE) {
            return this.meili.notes.deleteDocument(job.data.noteId);
          }

          if (job.name === JOB_NAMES.REINDEX_CATEGORY_NOTES) {
            const links = await this.prisma.noteCategory.findMany({
              where: { categoryId: job.data.categoryId },
              select: { noteId: true },
            });

            await Promise.all(
              links.map((link) => this.syncNoteIndex(link.noteId)),
            );

            return;
          }

          return this.syncNoteIndex(job.data.noteId);
        },
        { connection: this.queues.connection },
      ),
    );
    this.workers.push(
      new Worker(
        QUEUE_NAMES.RECAP,
        async (job) => {
          if (
            job.name === JOB_NAMES.SEND_EMAIL ||
            job.name === JOB_NAMES.SEND_TELEGRAM
          )
            await this.recaps.deliver(BigInt(job.data.deliveryId));
        },
        { connection: this.queues.connection },
      ),
    );
    const tick = async () => {
      await this.recaps.enqueueDue();
      if (Date.now() - this.lastCleanup > 86_400_000) {
        this.lastCleanup = Date.now();
        await this.prisma.activityEvent.deleteMany({
          where: { occurredAt: { lt: new Date(Date.now() - 90 * 86_400_000) } },
        });
        await this.uploads.deleteExpiredPhysicalFiles();
      }
    };
    await tick();
    this.timer = setInterval(() => void tick(), 60_000);
  }

  private async syncNoteIndex(noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      include: { categories: { include: { category: true } } },
    });

    if (!note || note.deletedAt || !isShownInGlobalSearch(note)) {
      return this.meili.notes.deleteDocument(noteId);
    }

    return this.meili.notes.addDocuments(
      [
        {
          id: note.id,
          userId: note.userId,
          title: note.title,
          titleNormalized: normalizeSearch(note.title),
          contentText: note.contentText,
          contentNormalized: normalizeSearch(note.contentText),
          categoryIds: note.categories.map((x) => x.categoryId),
          categoryNames: note.categories.map((x) => x.category.name),
          pinned: note.pinned,
          createdAt: Math.floor(note.createdAt.getTime() / 1000),
          updatedAt: Math.floor(note.updatedAt.getTime() / 1000),
        },
      ],
      { primaryKey: "id" },
    );
  }

  async onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
    await Promise.all(this.workers.map((x) => x.close()));
  }
}
