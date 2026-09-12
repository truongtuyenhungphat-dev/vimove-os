/**
 * Di trú danh mục sản phẩm công khai từ hệ thống Firebase cũ (Phase 16).
 *
 * Nguồn: scripts/data/legacy-products.json — xuất từ Firestore `products`
 * (2026-09-12), 12 documents nhưng chỉ 6 sản phẩm thật — Firestore có DUPLICATE
 * hoàn toàn (cùng tên/giá/số ảnh, chỉ khác id + createdAt vài tuần) cho cả 6 sản
 * phẩm, phát hiện khi kiểm tra dữ liệu trước khi viết script này. Dedupe theo
 * `name`, giữ bản `createdAt` MỚI NHẤT mỗi tên.
 *
 * images[] trong Firestore là đường dẫn tương đối kiểu cũ
 * ("../assets/images/products/xxx.jpg", tính từ san-pham/*.html) — chuyển
 * thành "/products/xxx.jpg" khớp với public/products/ đã copy sẵn trong repo
 * này (73 ảnh, xem git log "Add real product images").
 *
 * slug không có sẵn trong Firestore — tự sinh từ tên (bỏ dấu, kebab-case),
 * @unique trong schema nên nếu trùng sẽ lỗi rõ ràng thay vì âm thầm ghi đè.
 *
 * Đối chiếu theo slug — an toàn chạy lại (update thay vì tạo trùng).
 *
 * Chạy: npx tsx scripts/migrate-product-catalog.ts
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type LegacyProduct = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category?: string;
  material?: string;
  sizes?: string[];
  colors?: string[];
  description?: string;
  images?: string[];
  createdAt?: { _seconds: number; _nanoseconds: number };
};

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fixImagePath(p: string): string {
  // "../assets/images/products/xxx.jpg" (hoặc biến thể) -> "/products/xxx.jpg"
  const filename = p.split("/").pop();
  return filename ? `/products/${filename}` : p;
}

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) throw new Error("Không tìm thấy organization 'vimove'.");

  const raw: LegacyProduct[] = JSON.parse(readFileSync(join(__dirname, "data/legacy-products.json"), "utf-8"));

  // Dedupe theo name, giữ createdAt mới nhất.
  const byName = new Map<string, LegacyProduct>();
  for (const p of raw) {
    const existing = byName.get(p.name);
    const createdSec = p.createdAt?._seconds ?? 0;
    const existingSec = existing?.createdAt?._seconds ?? 0;
    if (!existing || createdSec > existingSec) byName.set(p.name, p);
  }
  const products = [...byName.values()];
  console.log(`Nguồn: ${raw.length} documents -> ${products.length} sản phẩm sau khi bỏ trùng.`);

  let created = 0;
  let updated = 0;
  for (const p of products) {
    const slug = slugify(p.name);
    const data = {
      name: p.name,
      price: p.price ?? 0,
      oldPrice: p.oldPrice ?? null,
      category: p.category ?? null,
      material: p.material ?? null,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      description: p.description ?? null,
      images: (p.images ?? []).map(fixImagePath),
      isPublished: true,
      isActive: true,
    };

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({ where: { slug }, data });
      updated++;
    } else {
      await prisma.product.create({ data: { organizationId: organization.id, slug, ...data } });
      created++;
    }
  }

  console.log(`Sản phẩm: ${created} tạo mới, ${updated} cập nhật (đối chiếu theo slug — an toàn chạy lại).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
