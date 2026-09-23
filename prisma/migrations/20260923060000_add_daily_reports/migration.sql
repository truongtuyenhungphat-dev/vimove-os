-- CreateEnum
CREATE TYPE "DailyReportItemSource" AS ENUM ('FIXED', 'ADHOC');

-- CreateEnum
CREATE TYPE "DailyReportItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'POSTPONED');

-- CreateTable
CREATE TABLE "recurring_task_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_report_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DailyReportItemStatus" NOT NULL DEFAULT 'TODO',
    "source" "DailyReportItemSource" NOT NULL,
    "templateId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_task_templates_organizationId_roleTitle_idx" ON "recurring_task_templates"("organizationId", "roleTitle");

-- CreateIndex
CREATE INDEX "daily_report_items_organizationId_date_idx" ON "daily_report_items"("organizationId", "date");

-- CreateIndex
CREATE INDEX "daily_report_items_userId_date_idx" ON "daily_report_items"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_report_items_userId_date_templateId_key" ON "daily_report_items"("userId", "date", "templateId");

-- AddForeignKey
ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_task_templates" ADD CONSTRAINT "recurring_task_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_items" ADD CONSTRAINT "daily_report_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_items" ADD CONSTRAINT "daily_report_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_items" ADD CONSTRAINT "daily_report_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "recurring_task_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
