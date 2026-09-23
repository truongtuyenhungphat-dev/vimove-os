-- CreateTable
CREATE TABLE "training_videos" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedDate" DATE,
    "youtubeUrl" TEXT NOT NULL,
    "mbsUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_videos_organizationId_category_idx" ON "training_videos"("organizationId", "category");

-- CreateIndex
CREATE INDEX "training_videos_organizationId_order_idx" ON "training_videos"("organizationId", "order");

-- AddForeignKey
ALTER TABLE "training_videos" ADD CONSTRAINT "training_videos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_videos" ADD CONSTRAINT "training_videos_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
