import { ActivityType, NotificationProvider } from "@prisma/client";

export const QUEUE_NAMES = {
  SEARCH: "search",
  RECAP: "recap",
  BACKUP_NOTIFY: "backup-notify",
} as const;

export const JOB_NAMES = {
  INDEX_NOTE: "index-note",
  DELETE_NOTE: "delete-note",
  REINDEX_CATEGORY_NOTES: "reindex-category-notes",
  SCHEDULE_RECAPS: "schedule-recaps",
  SEND_EMAIL: "send-email",
  SEND_TELEGRAM: "send-telegram",
  SEND_BACKUP_NOTIFY: "send-backup-notify",
} as const;

export const SEARCH_INDEXES = { NOTES: "notes" } as const;

export const TOKEN_TTL = {
  ACCESS: "15m",
  REFRESH_DAYS: 30,
  AUTH_HOURS: 1,
} as const;

export const ACTIVITY_TYPES = ActivityType;

export const NOTIFICATION_PROVIDERS = NotificationProvider;
