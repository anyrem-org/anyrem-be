import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Worker } from "bullmq";
import { JOB_NAMES, QUEUE_NAMES } from "./common/constants/app.constants.js";
import { normalizeSearch } from "./modules/search/search.helpers.js";
import { MeiliService } from "./infrastructure/search/meili.service.js";
import { PrismaService } from "./infrastructure/prisma/prisma.module.js";
import { QueueService } from "./infrastructure/queue/queue.service.js";
import { RecapService } from "./modules/recap/recap.service.js";

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

          const note = await this.prisma.note.findUnique({
            where: { id: job.data.noteId },
            include: { categories: { include: { category: true } } },
          });

          if (!note || note.deletedAt) {
            return this.meili.notes.deleteDocument(job.data.noteId);
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
      }
    };
    await tick();
    this.timer = setInterval(() => void tick(), 60_000);
  }
  async onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
    await Promise.all(this.workers.map((x) => x.close()));
  }
}
