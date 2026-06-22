import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Item = { name: string; file: string; style?: string; seed?: string; sortOrder?: number };
const root = resolve("assets/avatars");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8")) as Item[];
const prisma = new PrismaClient();
for (const item of manifest) {
  const data = await readFile(resolve(root, item.file));
  if (data.length > 256 * 1024 || data.subarray(1, 4).toString() !== "PNG") throw new Error(`${item.file}: expected PNG <= 256 KB`);
  const sha256 = createHash("sha256").update(data).digest("hex");
  await prisma.avatarCatalog.upsert({ where: { sha256 }, create: { name: item.name, style: item.style, seed: item.seed, mimeType: "image/png", imageData: data, imageSize: data.length, sha256, sortOrder: item.sortOrder ?? 0 }, update: { name: item.name, style: item.style, seed: item.seed, imageData: data, imageSize: data.length, sortOrder: item.sortOrder ?? 0, active: true } });
}
await prisma.$disconnect();
console.log(`Imported ${manifest.length} avatars.`);
