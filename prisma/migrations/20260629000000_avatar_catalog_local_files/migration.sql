ALTER TABLE "avatar_catalog" RENAME TO "avatars";

ALTER TABLE "avatars" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "avatars" RENAME COLUMN "active" TO "is_active";
ALTER TABLE "avatars" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "avatars" RENAME COLUMN "updatedAt" TO "updated_at";

DROP INDEX IF EXISTS "avatar_catalog_sha256_key";
DROP INDEX IF EXISTS "avatar_catalog_active_sortOrder_idx";

ALTER TABLE "avatars"
  ADD COLUMN "provider" VARCHAR(40) NOT NULL DEFAULT 'legacy',
  ADD COLUMN "version" VARCHAR(40) NOT NULL DEFAULT 'legacy',
  ADD COLUMN "style_name" VARCHAR(100) NOT NULL DEFAULT 'Legacy',
  ADD COLUMN "file_path" VARCHAR(255) NOT NULL DEFAULT '';

UPDATE "avatars"
SET
  "style" = COALESCE("style", 'legacy'),
  "seed" = COALESCE("seed", "id"::text),
  "style_name" = CASE
    WHEN COALESCE("style", '') = '' THEN 'Legacy'
    ELSE INITCAP(REPLACE("style", '-', ' '))
  END;

ALTER TABLE "avatars"
  ALTER COLUMN "style" SET NOT NULL,
  ALTER COLUMN "seed" SET NOT NULL;

ALTER TABLE "avatars"
  DROP COLUMN "mimeType",
  DROP COLUMN "imageData",
  DROP COLUMN "imageSize",
  DROP COLUMN "sha256";

CREATE UNIQUE INDEX "avatars_provider_version_style_seed_key"
  ON "avatars"("provider", "version", "style", "seed");
CREATE INDEX "avatars_style_idx" ON "avatars"("style");
CREATE INDEX "avatars_is_active_idx" ON "avatars"("is_active");
CREATE INDEX "avatars_sort_order_idx" ON "avatars"("sort_order");
