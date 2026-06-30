import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";

const mimeExt: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const uploadsRoot = () => resolve(process.cwd(), "uploads");

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async image(userId: string, dataUrl: string, name: string) {
    const match = dataUrl.match(
      /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/,
    );
    if (!match) throw new BadRequestException("Invalid image");
    const buffer = Buffer.from(match[2]!, "base64");
    if (!buffer.length || buffer.length > 5 * 1024 * 1024)
      throw new BadRequestException("Image must be 1 byte to 5 MB");

    const ext = mimeExt[match[1]!] ?? extname(name).toLowerCase();
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dir = resolve(uploadsRoot(), "note-images", userId, yyyy, mm);
    await mkdir(dir, { recursive: true });

    const id = randomUUID();
    const path = `/uploads/note-images/${userId}/${yyyy}/${mm}/${id}${ext}`;
    await writeFile(resolve(dir, `${id}${ext}`), buffer);
    await this.prisma.$executeRaw`
      INSERT INTO "uploads" ("id", "userId", "path", "mimeType", "sizeBytes")
      VALUES (${id}::uuid, ${userId}::uuid, ${path}, ${match[1]}, ${buffer.length})
    `;
    return { url: path };
  }

  async syncNoteImages(userId: string, noteId: string, paths: string[]) {
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE "uploads"
        SET "noteId" = ${noteId}::uuid, "deletedAt" = NULL
        WHERE "userId" = ${userId}::uuid
        AND "path" = ANY(${paths})
      `,
      this.prisma.$executeRaw`
        UPDATE "uploads"
        SET "deletedAt" = COALESCE("deletedAt", NOW())
        WHERE "userId" = ${userId}::uuid
        AND "noteId" = ${noteId}::uuid
        AND NOT ("path" = ANY(${paths}))
      `,
    ]);
  }

  async markNoteImagesDeleted(userId: string, noteId: string) {
    await this.prisma.$executeRaw`
      UPDATE "uploads"
      SET "deletedAt" = COALESCE("deletedAt", NOW())
      WHERE "userId" = ${userId}::uuid
      AND "noteId" = ${noteId}::uuid
    `;
  }

  async deleteExpiredPhysicalFiles() {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; path: string }>
    >`
      SELECT "id", "path"
      FROM "uploads"
      WHERE "deletedAt" < NOW() - INTERVAL '24 hours'
      LIMIT 100
    `;
    for (const row of rows) {
      const file = resolve(process.cwd(), row.path.replace(/^\//, ""));
      if (!file.startsWith(uploadsRoot())) continue;
      await unlink(file).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
      await this.prisma
        .$executeRaw`DELETE FROM "uploads" WHERE "id" = ${row.id}::uuid`;
    }
    await pruneEmptyDirs(resolve(uploadsRoot(), "note-images"));
    return rows.length;
  }
}

async function pruneEmptyDirs(dir: string) {
  const entries = await readdir(dir).catch(() => []);
  await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(dir, entry);
      if (!(await stat(path)).isDirectory()) return;
      await pruneEmptyDirs(path);
      await readdir(path)
        .then((items) =>
          items.length
            ? undefined
            : import("node:fs/promises").then((fs) => fs.rmdir(path)),
        )
        .catch(() => undefined);
    }),
  );
}
