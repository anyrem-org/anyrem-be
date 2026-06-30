CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "noteId" UUID,
    "path" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(80) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),
    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uploads_path_key" ON "uploads"("path");
CREATE INDEX "uploads_userId_idx" ON "uploads"("userId");
CREATE INDEX "uploads_noteId_idx" ON "uploads"("noteId");
CREATE INDEX "uploads_deletedAt_idx" ON "uploads"("deletedAt");
