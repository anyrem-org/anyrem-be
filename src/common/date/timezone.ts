const parts = (date: Date, timeZone: string) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date).filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)])) as Record<string, number>;

const utcForLocal = (year: number, month: number, day: number, timeZone: string) => {
  let timestamp = Date.UTC(year, month - 1, day);
  for (let i = 0; i < 2; i++) { const p = parts(new Date(timestamp), timeZone); const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); timestamp += Date.UTC(year, month - 1, day) - rendered; }
  return new Date(timestamp);
};

export const localDateInfo = (now: Date, timeZone: string) => {
  const p = parts(now, timeZone); const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const start = utcForLocal(p.year, p.month, p.day, timeZone); const next = new Date(Date.UTC(p.year, p.month - 1, p.day + 1)); const end = utcForLocal(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone);
  return { key, localTime: `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`, start, end, dbDate: new Date(`${key}T00:00:00.000Z`) };
};
