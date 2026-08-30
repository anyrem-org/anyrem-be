import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import {
  JOB_NAMES,
  QUEUE_NAMES,
} from "../../common/constants/app.constants.js";

@Injectable()
export class QueueService implements OnModuleDestroy {
  readonly connection: { url: string };
  readonly search: Queue;
  readonly recap: Queue;
  readonly backupNotify: Queue;

  constructor(config: ConfigService) {
    this.connection = { url: config.getOrThrow("REDIS_URL") };

    this.search = new Queue(QUEUE_NAMES.SEARCH, {
      connection: this.connection,
    });

    this.recap = new Queue(QUEUE_NAMES.RECAP, { connection: this.connection });

    this.backupNotify = new Queue(QUEUE_NAMES.BACKUP_NOTIFY, {
      connection: this.connection,
    });
  }

  indexNote(noteId: string) {
    return this.search.add(
      JOB_NAMES.INDEX_NOTE,
      { noteId },
      { removeOnComplete: 100, removeOnFail: 100 },
    );
  }

  deleteNote(noteId: string) {
    return this.search.add(
      JOB_NAMES.DELETE_NOTE,
      { noteId },
      { removeOnComplete: 100 },
    );
  }

  reindexCategoryNotes(categoryId: string) {
    return this.search.add(
      JOB_NAMES.REINDEX_CATEGORY_NOTES,
      { categoryId },
      { removeOnComplete: 100, removeOnFail: 100 },
    );
  }

  enqueueBackupNotify(text: string, dedupeKey: string) {
    return this.backupNotify.add(
      JOB_NAMES.SEND_BACKUP_NOTIFY,
      { text },
      {
        jobId: `backup-notify-${dedupeKey}`,
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        // delay × 2^(attempt - 1)
        backoff: { type: "exponential", delay: 30_000 },
      },
    );
  }

  async onModuleDestroy() {
    await Promise.all([this.search.close(), this.recap.close()]);
  }
}
