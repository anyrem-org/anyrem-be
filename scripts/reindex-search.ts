import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import {
  JOB_NAMES,
  QUEUE_NAMES,
} from "../src/common/constants/app.constants.js";

const prisma = new PrismaClient();
const queue = new Queue(QUEUE_NAMES.SEARCH, {
  connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
});
const notes = await prisma.note.findMany({
  where: { deletedAt: null },
  select: { id: true },
});
await queue.addBulk(
  notes.map((x) => ({
    name: JOB_NAMES.INDEX_NOTE,
    data: { noteId: x.id },
    opts: { jobId: `reindex-${x.id}-${Date.now()}` },
  })),
);
await Promise.all([queue.close(), prisma.$disconnect()]);
console.log(`Queued ${notes.length} notes.`);
