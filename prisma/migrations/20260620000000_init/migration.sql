-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "NoteRelationType" AS ENUM ('MANUAL', 'SIMILAR');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'VIEWED', 'EDITED', 'PINNED', 'UNPINNED');

-- CreateEnum
CREATE TYPE "NotificationProvider" AS ENUM ('EMAIL', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "avatar_catalog" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "style" VARCHAR(60),
    "seed" VARCHAR(120),
    "mimeType" VARCHAR(40) NOT NULL,
    "imageData" BYTEA NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "avatar_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "name" VARCHAR(120) NOT NULL,
    "avatarId" UUID,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" CHAR(64) NOT NULL,
    "deviceName" VARCHAR(120),
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "lastUsedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "contentJson" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "contentHtml" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "lastOpenedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "description" VARCHAR(500),
    "color" CHAR(7) NOT NULL,
    "icon" VARCHAR(40),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_categories" (
    "userId" UUID NOT NULL,
    "noteId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_categories_pkey" PRIMARY KEY ("noteId","categoryId")
);

-- CreateTable
CREATE TABLE "note_relations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "leftNoteId" UUID NOT NULL,
    "rightNoteId" UUID NOT NULL,
    "type" "NoteRelationType" NOT NULL DEFAULT 'MANUAL',
    "score" DOUBLE PRECISION,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_relations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "note_relations_distinct_notes" CHECK ("leftNoteId" <> "rightNoteId"),
    CONSTRAINT "note_relations_canonical_order" CHECK ("leftNoteId" < "rightNoteId")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" BIGSERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "noteId" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_histories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "keyword" VARCHAR(300) NOT NULL,
    "keywordNormalized" VARCHAR(300) NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "lastSearchedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summaries" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "localDate" DATE NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "contentJson" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "noteCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" BIGSERIAL NOT NULL,
    "dailySummaryId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "NotificationProvider" NOT NULL,
    "recipientMasked" VARCHAR(255) NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avatar_catalog_sha256_key" ON "avatar_catalog"("sha256");

-- CreateIndex
CREATE INDEX "avatar_catalog_active_sortOrder_idx" ON "avatar_catalog"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_providerAccountId_key" ON "auth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_userId_provider_key" ON "auth_accounts"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_tokens_userId_type_idx" ON "auth_tokens"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_refreshTokenHash_key" ON "refresh_sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "refresh_sessions_userId_revokedAt_idx" ON "refresh_sessions"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "user_settings_userId_type_idx" ON "user_settings"("userId", "type");

-- CreateIndex
CREATE INDEX "user_settings_type_key_userId_idx" ON "user_settings"("type", "key", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_type_key_key" ON "user_settings"("userId", "type", "key");

-- CreateIndex
CREATE INDEX "notes_userId_createdAt_idx" ON "notes"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notes_userId_updatedAt_idx" ON "notes"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "notes_userId_lastOpenedAt_idx" ON "notes"("userId", "lastOpenedAt" DESC);

-- Fast pinned-note filter without indexing every unpinned row.
CREATE INDEX "notes_userId_pinned_idx" ON "notes"("userId") WHERE "pinned" = true AND "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "notes_id_userId_key" ON "notes"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_id_userId_key" ON "categories"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_key" ON "categories"("userId", "name");

-- CreateIndex
CREATE INDEX "note_categories_categoryId_noteId_idx" ON "note_categories"("categoryId", "noteId");

-- CreateIndex
CREATE INDEX "note_relations_userId_leftNoteId_idx" ON "note_relations"("userId", "leftNoteId");

-- CreateIndex
CREATE INDEX "note_relations_userId_rightNoteId_idx" ON "note_relations"("userId", "rightNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "note_relations_leftNoteId_rightNoteId_type_key" ON "note_relations"("leftNoteId", "rightNoteId", "type");

-- CreateIndex
CREATE INDEX "activity_events_userId_occurredAt_idx" ON "activity_events"("userId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "activity_events_userId_noteId_occurredAt_idx" ON "activity_events"("userId", "noteId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "search_histories_userId_lastSearchedAt_idx" ON "search_histories"("userId", "lastSearchedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "search_histories_userId_keywordNormalized_key" ON "search_histories"("userId", "keywordNormalized");

-- CreateIndex
CREATE INDEX "daily_summaries_userId_localDate_idx" ON "daily_summaries"("userId", "localDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_userId_localDate_key" ON "daily_summaries"("userId", "localDate");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_updatedAt_idx" ON "notification_deliveries"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "notification_deliveries_userId_createdAt_idx" ON "notification_deliveries"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_dailySummaryId_provider_key" ON "notification_deliveries"("dailySummaryId", "provider");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "avatar_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_categories" ADD CONSTRAINT "note_categories_noteId_userId_fkey" FOREIGN KEY ("noteId", "userId") REFERENCES "notes"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_categories" ADD CONSTRAINT "note_categories_categoryId_userId_fkey" FOREIGN KEY ("categoryId", "userId") REFERENCES "categories"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_relations" ADD CONSTRAINT "note_relations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_relations" ADD CONSTRAINT "note_relations_leftNoteId_userId_fkey" FOREIGN KEY ("leftNoteId", "userId") REFERENCES "notes"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_relations" ADD CONSTRAINT "note_relations_rightNoteId_userId_fkey" FOREIGN KEY ("rightNoteId", "userId") REFERENCES "notes"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_noteId_userId_fkey" FOREIGN KEY ("noteId", "userId") REFERENCES "notes"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_histories" ADD CONSTRAINT "search_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_dailySummaryId_fkey" FOREIGN KEY ("dailySummaryId") REFERENCES "daily_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
