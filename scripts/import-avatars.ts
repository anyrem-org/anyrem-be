// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

type ManifestItem = {
  name: string;
  file: string;
  provider: string;
  version: string;
  style: string;
  styleName: string;
  seed: string;
  sortOrder: number;
  isActive: boolean;
};

const root = resolve("assets/avatars");
const manifest = JSON.parse(
  await readFile(resolve(root, "manifest.json"), "utf8"),
) as ManifestItem[];
const prisma = new PrismaClient();

function validate(item: ManifestItem, index: number) {
  for (const key of [
    "name",
    "file",
    "provider",
    "version",
    "style",
    "styleName",
    "seed",
  ] as const) {
    if (!item[key] || typeof item[key] !== "string") {
      throw new Error(`manifest[${index}].${key} is required`);
    }
  }
  if (!Number.isInteger(item.sortOrder)) {
    throw new Error(`manifest[${index}].sortOrder must be an integer`);
  }
  if (typeof item.isActive !== "boolean") {
    throw new Error(`manifest[${index}].isActive must be a boolean`);
  }
}

let created = 0;
let updated = 0;
let failed = 0;

for (const [index, item] of manifest.entries()) {
  try {
    validate(item, index);
    const absolutePath = resolve(root, item.file);
    await access(absolutePath, constants.F_OK);
    const firstChunk = await readFile(absolutePath, "utf8");
    if (!firstChunk.trimStart().startsWith("<svg")) {
      throw new Error(`${item.file}: expected SVG`);
    }

    const data = {
      name: item.name,
      provider: item.provider,
      version: item.version,
      style: item.style,
      styleName: item.styleName,
      seed: item.seed,
      filePath: `/avatars/${item.file.replace(/\\/g, "/")}`,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    };
    const existing = await prisma.avatarCatalog.findUnique({
      where: {
        provider_version_style_seed: {
          provider: item.provider,
          version: item.version,
          style: item.style,
          seed: item.seed,
        },
      },
      select: { id: true },
    });
    await prisma.avatarCatalog.upsert({
      where: {
        provider_version_style_seed: {
          provider: item.provider,
          version: item.version,
          style: item.style,
          seed: item.seed,
        },
      },
      create: data,
      update: data,
    });
    if (existing) updated += 1;
    else created += 1;
  } catch (error) {
    failed += 1;
    console.error(`Avatar import failed at index ${index}:`, error);
  }
}

await prisma.$disconnect();
console.log(`Imported avatars. Created: ${created}. Updated: ${updated}. Failed: ${failed}.`);
