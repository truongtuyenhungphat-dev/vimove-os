-- CreateTable
CREATE TABLE "production_creators" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_creators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_creators_organizationId_idx" ON "production_creators"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "production_creators_organizationId_userId_key" ON "production_creators"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "production_creators" ADD CONSTRAINT "production_creators_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_creators" ADD CONSTRAINT "production_creators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
