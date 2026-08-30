import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module.js";
import { getObjectStorageConfig } from "../infrastructure/object-storage/object-storage.config.js";
import { ObjectStorageService } from "../infrastructure/object-storage/object-storage.service.js";
import { QueueService } from "../infrastructure/queue/queue.service.js";
import { dbDailyKey, uploadsKey } from "./backup.keys.js";
import { createReadStream } from "node:fs";
import {
  formatBackupCompleted,
  formatBackupFailed,
} from "./backup.messages.js";

const DB_DAILY_TYPE = "db-daily";
const UPLOADS_TYPE = "uploads";

const backupTypeIndex = process.argv.indexOf("--type");
const backupType =
  backupTypeIndex >= 0 ? process.argv[backupTypeIndex + 1] : null;

if (!backupType || ![DB_DAILY_TYPE, UPLOADS_TYPE].includes(backupType)) {
  console.error(
    `Error: --type argument is required and must be one of: ${DB_DAILY_TYPE}, ${UPLOADS_TYPE}`,
  );

  process.exit(1);
}

const fileIdx = process.argv.indexOf("--file");
const filePath = fileIdx >= 0 ? process.argv[fileIdx + 1] : null;

if (!filePath) {
  console.error("Error: --file argument is required");
  process.exit(1);
}

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ["error", "warn"],
});

const storageService = app.get(ObjectStorageService);
const queues = app.get(QueueService);
const configService = app.get(ConfigService);

const { bucket } = getObjectStorageConfig(configService);

const databaseDailyKey = dbDailyKey();
const uploadsDailyKey = uploadsKey();

async function notify(text: string, dedupe: string) {
  try {
    await queues.enqueueBackupNotify(text, dedupe);
  } catch (error) {
    console.error("Error: failed to notify", error);
  }
}

const key = backupType === DB_DAILY_TYPE ? databaseDailyKey : uploadsDailyKey;

try {
  const sizeBytes = await storageService.upload(
    key,
    createReadStream(filePath),
    "application/gzip",
  );

  await notify(formatBackupCompleted(bucket, key, sizeBytes), key);

  console.log(`Uploaded s3://${bucket}/${key} (${sizeBytes} bytes)`);
} catch (error) {
  await notify(formatBackupFailed(bucket, key, error), key);

  console.error("Error: failed to upload database daily", error);

  process.exit(1);
} finally {
  await app.close();
}
