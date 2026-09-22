-- CreateEnum
CREATE TYPE "ContentPieceStage" AS ENUM ('IDEA', 'SCRIPT', 'SHOOT', 'EDIT', 'REVIEW', 'POSTED');

-- CreateTable
CREATE TABLE "production_channels" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taskTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pieces" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelId" TEXT,
    "assigneeId" TEXT,
    "stage" "ContentPieceStage" NOT NULL DEFAULT 'IDEA',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "counts" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_channels_organizationId_idx" ON "production_channels"("organizationId");

-- CreateIndex
CREATE INDEX "content_pieces_organizationId_idx" ON "content_pieces"("organizationId");

-- CreateIndex
CREATE INDEX "content_pieces_organizationId_stage_idx" ON "content_pieces"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "production_entries_organizationId_date_idx" ON "production_entries"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "production_entries_organizationId_date_userId_channelId_key" ON "production_entries"("organizationId", "date", "userId", "channelId");

-- AddForeignKey
ALTER TABLE "production_channels" ADD CONSTRAINT "production_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pieces" ADD CONSTRAINT "content_pieces_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pieces" ADD CONSTRAINT "content_pieces_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "production_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pieces" ADD CONSTRAINT "content_pieces_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pieces" ADD CONSTRAINT "content_pieces_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_entries" ADD CONSTRAINT "production_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_entries" ADD CONSTRAINT "production_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_entries" ADD CONSTRAINT "production_entries_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "production_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
