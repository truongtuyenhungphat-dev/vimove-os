-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('ALL', 'DEPARTMENT', 'OWN');

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "scope" "PermissionScope" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "path" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_logs_organizationId_createdAt_idx" ON "error_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "attribution_touchpoints_organizationId_landingPageId_idx" ON "attribution_touchpoints"("organizationId", "landingPageId");

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
