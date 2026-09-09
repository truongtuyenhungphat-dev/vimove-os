-- CreateEnum
CREATE TYPE "ReportDataset" AS ENUM ('LEADS', 'ORDERS', 'CAMPAIGNS', 'CONTENT');

-- CreateEnum
CREATE TYPE "ReportVisualization" AS ENUM ('TABLE', 'BAR', 'LINE', 'PIE');

-- CreateEnum
CREATE TYPE "DataQualityIssueType" AS ENUM ('SYNC_FAILURE', 'MISSING_UTM', 'DUPLICATE_EVENT', 'STALE_ACCOUNT', 'METRIC_MISMATCH');

-- CreateEnum
CREATE TYPE "DataQualitySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DataQualityStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_touchpoints" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "landingPageId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_touchpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "firstTouchpointId" TEXT,
    "lastTouchpointId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "wonLeads" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "spend" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_widgets" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "dataset" "ReportDataset" NOT NULL,
    "dimension" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "filters" JSONB,
    "visualization" "ReportVisualization" NOT NULL DEFAULT 'TABLE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_issues" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "DataQualityIssueType" NOT NULL,
    "severity" "DataQualitySeverity" NOT NULL DEFAULT 'MEDIUM',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DataQualityStatus" NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_quality_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_idempotencyKey_key" ON "events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "events_organizationId_type_occurredAt_idx" ON "events"("organizationId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "attribution_touchpoints_organizationId_visitorId_occurredAt_idx" ON "attribution_touchpoints"("organizationId", "visitorId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "attribution_events_idempotencyKey_key" ON "attribution_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "attribution_events_organizationId_occurredAt_idx" ON "attribution_events"("organizationId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_organizationId_date_key" ON "daily_metrics"("organizationId", "date");

-- CreateIndex
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

-- CreateIndex
CREATE INDEX "report_widgets_reportId_idx" ON "report_widgets"("reportId");

-- CreateIndex
CREATE INDEX "data_quality_issues_organizationId_status_idx" ON "data_quality_issues"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "data_quality_issues_organizationId_type_entityType_entityId_key" ON "data_quality_issues"("organizationId", "type", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_touchpoints" ADD CONSTRAINT "attribution_touchpoints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_events" ADD CONSTRAINT "attribution_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_events" ADD CONSTRAINT "attribution_events_firstTouchpointId_fkey" FOREIGN KEY ("firstTouchpointId") REFERENCES "attribution_touchpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution_events" ADD CONSTRAINT "attribution_events_lastTouchpointId_fkey" FOREIGN KEY ("lastTouchpointId") REFERENCES "attribution_touchpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_widgets" ADD CONSTRAINT "report_widgets_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_quality_issues" ADD CONSTRAINT "data_quality_issues_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
