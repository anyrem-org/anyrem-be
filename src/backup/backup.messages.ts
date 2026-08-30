import { DateTime } from "luxon";

export function formatBackupStarted(bucket: string, key: string) {
  const messageStarted = [
    "🚀 <b>AnyRem Backup — Upload Started</b>",
    "",
    `🪣 Bucket: <code>${bucket}</code>`,
    `🔑 Key: <code>${key}</code>`,
    "",
    `🕐 ${new Date().toISOString()}`,
  ].join("\n");

  return messageStarted;
}

export function formatBackupCompleted(
  bucket: string,
  key: string,
  sizeBytes: number,
) {
  const dateTime = DateTime.fromJSDate(new Date()).setZone("UTC").toISO();

  const messageCompleted = [
    "✅ <b>AnyRem Backup — Upload Completed</b>",
    "",
    `🪣 Bucket: <code>${bucket}</code>`,
    `🔑 Key: <code>${key}</code>`,
    `💾 Size: <code>${formatBytes(sizeBytes)}</code>`,
    "",
    `🕐 ${dateTime}`,
  ].join("\n");

  return messageCompleted;
}

export function formatBackupFailed(
  bucket: string,
  key: string,
  error: unknown,
) {
  const dateTime = DateTime.fromJSDate(new Date()).setZone("UTC").toISO();

  const messageFailed = [
    "❌ <b>AnyRem Backup — Upload Failed</b>",
    "",
    `🪣 Bucket: <code>${bucket}</code>`,
    `🔑 Key: <code>${key}</code>`,
    "",
    "⚠️ Error:",
    `<code>${(error as Error)?.message}</code>`,
    "",
    `🕐 ${dateTime}`,
  ].join("\n");

  return messageFailed;
}

function formatBytes(n: number) {
  if (n < 1024) {
    return `${n} B`;
  }

  if (n < 1024 ** 2) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}
