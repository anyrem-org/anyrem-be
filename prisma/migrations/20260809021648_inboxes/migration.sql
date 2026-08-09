-- AlterTable
ALTER TABLE "avatars"
  RENAME CONSTRAINT "avatar_catalog_pkey" TO "avatars_pkey";

ALTER TABLE "avatars"
  ALTER COLUMN "provider" DROP DEFAULT,
  ALTER COLUMN "version" DROP DEFAULT,
  ALTER COLUMN "style_name" DROP DEFAULT,
  ALTER COLUMN "file_path" DROP DEFAULT;

-- CreateTable
CREATE TABLE "inboxes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "inboxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inboxes_userId_idx" ON "inboxes"("userId");

-- AddForeignKey
ALTER TABLE "inboxes" ADD CONSTRAINT "inboxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
