-- CreateEnum
CREATE TYPE "TrackedPlatform" AS ENUM ('TIKTOK', 'YOUTUBE', 'FACEBOOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "TrackedChannelStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REMOVED');

-- CreateTable
CREATE TABLE "tracked_channels" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "TrackedPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "label" TEXT,
    "status" "TrackedChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "baselineFollowers" INTEGER,
    "baselineViews" INTEGER,
    "avatarUrl" TEXT,
    "postIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracked_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_snapshots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "followers" INTEGER,
    "totalViews" INTEGER,
    "videosCount" INTEGER,
    "engagement" INTEGER,
    "raw" JSONB,
    "scrapeStatus" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_platform_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "apifyActor" TEXT NOT NULL,
    "inputTemplate" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_platform_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_scrape_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "runId" TEXT,
    "platform" TEXT,
    "actor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'started',
    "channelsCount" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "channel_scrape_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracked_channels_organizationId_status_idx" ON "tracked_channels"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_channels_organizationId_platform_username_key" ON "tracked_channels"("organizationId", "platform", "username");

-- CreateIndex
CREATE INDEX "channel_snapshots_channelId_date_idx" ON "channel_snapshots"("channelId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "channel_snapshots_channelId_date_key" ON "channel_snapshots"("channelId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "channel_platform_configs_organizationId_platform_key" ON "channel_platform_configs"("organizationId", "platform");

-- CreateIndex
CREATE INDEX "channel_scrape_runs_organizationId_startedAt_idx" ON "channel_scrape_runs"("organizationId", "startedAt");

-- AddForeignKey
ALTER TABLE "tracked_channels" ADD CONSTRAINT "tracked_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_snapshots" ADD CONSTRAINT "channel_snapshots_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_platform_configs" ADD CONSTRAINT "channel_platform_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_scrape_runs" ADD CONSTRAINT "channel_scrape_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
