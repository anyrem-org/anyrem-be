import { DateTime } from "luxon";

export const BACKUP_PREFIX = {
  dbDaily: "db/daily",
  uploads: "uploads",
};

export function dbDailyKey(date = new Date()) {
  const day = DateTime.fromJSDate(date).setZone("UTC").toFormat("yyyy-MM-dd");

  return `${BACKUP_PREFIX.dbDaily}/${day}.sql.gz`;
}

export function uploadsKey(date = new Date()) {
  const day = DateTime.fromJSDate(date).setZone("UTC").toFormat("yyyy-MM-dd");

  return `${BACKUP_PREFIX.uploads}/${day}.tar.gz`;
}
