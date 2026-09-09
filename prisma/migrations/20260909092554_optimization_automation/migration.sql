-- AlterEnum
ALTER TYPE "AiActionType" ADD VALUE 'ADJUST_BUDGET';

-- AlterEnum
ALTER TYPE "AiInsightType" ADD VALUE 'BUDGET_OPTIMIZATION';

-- AlterTable
ALTER TABLE "ai_recommendations" ADD COLUMN     "payload" JSONB;

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "triggerEventType" TEXT;

-- CreateIndex
CREATE INDEX "workflows_organizationId_triggerEventType_isActive_idx" ON "workflows"("organizationId", "triggerEventType", "isActive");
