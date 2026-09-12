-- AlterTable
ALTER TABLE "products" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "oldPrice" DECIMAL(14,2),
ADD COLUMN     "category" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
