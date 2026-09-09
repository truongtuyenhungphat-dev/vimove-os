-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('META', 'GOOGLE', 'TIKTOK', 'ZALO');

-- CreateEnum
CREATE TYPE "AdConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "AdEntityStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ad_connections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "status" "AdConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "accountLabel" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectedById" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_accounts" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AdEntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "dailyBudget" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_adsets" (
    "id" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AdEntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_adsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL,
    "adAdSetId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AdEntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creatives" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "externalId" TEXT,
    "headline" TEXT,
    "body" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_metrics_daily" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "adCampaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_metrics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_connections_organizationId_idx" ON "ad_connections"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_connections_organizationId_platform_key" ON "ad_connections"("organizationId", "platform");

-- CreateIndex
CREATE INDEX "ad_accounts_connectionId_idx" ON "ad_accounts"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_accounts_connectionId_externalId_key" ON "ad_accounts"("connectionId", "externalId");

-- CreateIndex
CREATE INDEX "ad_campaigns_adAccountId_idx" ON "ad_campaigns"("adAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaigns_adAccountId_externalId_key" ON "ad_campaigns"("adAccountId", "externalId");

-- CreateIndex
CREATE INDEX "ad_adsets_adCampaignId_idx" ON "ad_adsets"("adCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_adsets_adCampaignId_externalId_key" ON "ad_adsets"("adCampaignId", "externalId");

-- CreateIndex
CREATE INDEX "ads_adAdSetId_idx" ON "ads"("adAdSetId");

-- CreateIndex
CREATE UNIQUE INDEX "ads_adAdSetId_externalId_key" ON "ads"("adAdSetId", "externalId");

-- CreateIndex
CREATE INDEX "ad_creatives_adId_idx" ON "ad_creatives"("adId");

-- CreateIndex
CREATE INDEX "ad_metrics_daily_adAccountId_date_idx" ON "ad_metrics_daily"("adAccountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_metrics_daily_adCampaignId_date_key" ON "ad_metrics_daily"("adCampaignId", "date");

-- AddForeignKey
ALTER TABLE "ad_connections" ADD CONSTRAINT "ad_connections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_connections" ADD CONSTRAINT "ad_connections_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ad_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_adsets" ADD CONSTRAINT "ad_adsets_adCampaignId_fkey" FOREIGN KEY ("adCampaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_adAdSetId_fkey" FOREIGN KEY ("adAdSetId") REFERENCES "ad_adsets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_metrics_daily" ADD CONSTRAINT "ad_metrics_daily_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_metrics_daily" ADD CONSTRAINT "ad_metrics_daily_adCampaignId_fkey" FOREIGN KEY ("adCampaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
