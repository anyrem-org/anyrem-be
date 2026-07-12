import { DateTime } from "luxon";

export const localDateInfo = (now: Date, timeZone: string) => {
  const currentDateTime = DateTime.fromJSDate(now).setZone(timeZone);

  const key = currentDateTime.toISODate()!;

  // convert current timezone to UTC
  const start = currentDateTime.startOf("day").toUTC().toJSDate();
  const end = currentDateTime
    .plus({ days: 1 })
    .startOf("day")
    .toUTC()
    .toJSDate();

  const localTime = currentDateTime.toFormat("HH:mm");

  return {
    key,
    localTime,
    start,
    end,
    dbDate: new Date(`${key}T00:00:00.000Z`),
  };
};

export const getCurrentDateTime = (timeZone: string) => {
  return DateTime.local().setZone(timeZone);
};
