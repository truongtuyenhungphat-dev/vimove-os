/**
 * Di trú Khách hàng + Bảo hành từ hệ thống Firebase cũ (Phase 15) vào VIMOVE OS.
 *
 * Nguồn: scripts/data/legacy-customers.json (33 dòng, xuất từ Firestore `customers`,
 *        2026-09-08) và scripts/data/legacy-warranties.json (35 dòng, xuất từ
 *        Firestore `warranties`, cùng ngày) — cả hai converts nguyên vẹn từ CSV gốc,
 *        không chỉnh sửa nội dung.
 *
 * Đối chiếu Customer theo SỐ ĐIỆN THOẠI trong cùng organization — Prisma Customer
 * không có @unique trên phone nên script tự tra cứu (findFirst) trước khi tạo, tránh
 * trùng nếu chạy lại nhiều lần. Warranty đối chiếu theo warrantyCode (@unique thật
 * trong schema) — record đã tồn tại thì bỏ qua, không tạo trùng hay ghi đè.
 *
 * 1 bản ghi bảo hành không có customerPhone (kiểm tra trước khi chạy: 1/35) sẽ tạo
 * Customer riêng theo customerName, không đối chiếu được với ai — in cảnh báo rõ.
 *
 * Chạy: npx tsx scripts/migrate-warranty-data.ts
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "../app/generated/prisma/client";
import type { WarrantyStatus } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type LegacyCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
};

type LegacyWarranty = {
  id: string;
  customerPhone: string;
  productName: string;
  notes: string;
  purchaseDate: string;
  warrantyCode: string;
  size: string;
  purchaseChannel: string;
  customerCity: string;
  customerEmail: string;
  status: string;
  registeredAt: string;
  color: string;
  customerAddress: string;
  customerName: string;
  warrantyExpiry: string;
};

const STATUS_MAP: Record<string, WarrantyStatus> = {
  active: "ACTIVE",
  claimed: "CLAIMED",
  expired: "EXPIRED",
  voided: "VOIDED",
};

function toDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function combineAddress(address: string | undefined, city: string | undefined): string | null {
  const parts = [address, city].map((p) => (p ?? "").trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) throw new Error("Không tìm thấy organization 'vimove'. Chạy prisma/seed.ts trước.");

  const legacyCustomers: LegacyCustomer[] = JSON.parse(
    readFileSync(join(__dirname, "data/legacy-customers.json"), "utf-8"),
  );
  const legacyWarranties: LegacyWarranty[] = JSON.parse(
    readFileSync(join(__dirname, "data/legacy-warranties.json"), "utf-8"),
  );

  const customerIdByPhone = new Map<string, string>();

  async function ensureCustomer(
    phone: string,
    name: string,
    email: string | null,
    address: string | null,
  ): Promise<string> {
    const key = phone.trim();
    const cached = customerIdByPhone.get(key);
    if (cached) return cached;

    const existing = await prisma.customer.findFirst({
      where: { organizationId: organization!.id, phone: key },
    });
    if (existing) {
      customerIdByPhone.set(key, existing.id);
      return existing.id;
    }
    const created = await prisma.customer.create({
      data: { organizationId: organization!.id, name, phone: key, email, address },
    });
    customerIdByPhone.set(key, created.id);
    return created.id;
  }

  let customersFromCustomersJson = 0;
  for (const c of legacyCustomers) {
    if (!c.phone?.trim()) {
      console.warn(`Bỏ qua khách hàng không có SĐT trong legacy-customers.json: ${c.name} (${c.id})`);
      continue;
    }
    const before = customerIdByPhone.size;
    await ensureCustomer(c.phone, c.name, c.email || null, combineAddress(c.address, c.city));
    if (customerIdByPhone.size > before) customersFromCustomersJson++;
  }

  let warrantiesCreated = 0;
  let warrantiesSkipped = 0;
  let extraCustomersFromWarranty = 0;
  let warrantiesNoPhone = 0;
  let junkSkipped = 0;

  for (const w of legacyWarranties) {
    // Real bug found in the source data during a dry run against local dev:
    // warrantyCode "TEST-DEBUG-CHECK-2" (customerName "Debug Test 2", every
    // other field blank) — leftover test data in the old Firestore
    // `warranties` collection, not a real customer record. productName
    // empty is a reliable signal for this junk (every real registration has
    // one) — filter by that instead of the one code we happened to spot, in
    // case there are other similar rows.
    if (!w.productName?.trim()) {
      console.warn(`Bỏ qua bản ghi rác (không có productName): ${w.warrantyCode} — "${w.customerName}"`);
      junkSkipped++;
      continue;
    }

    const existingWarranty = await prisma.warranty.findUnique({ where: { warrantyCode: w.warrantyCode } });
    if (existingWarranty) {
      warrantiesSkipped++;
      continue;
    }

    const phone = w.customerPhone?.trim();
    let customerId: string;
    if (phone) {
      const before = customerIdByPhone.size;
      customerId = await ensureCustomer(
        phone,
        w.customerName,
        w.customerEmail || null,
        combineAddress(w.customerAddress, w.customerCity),
      );
      if (customerIdByPhone.size > before) extraCustomersFromWarranty++;
    } else {
      console.warn(`Bảo hành ${w.warrantyCode} không có customerPhone — tạo Customer riêng theo tên, không đối chiếu được.`);
      const created = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: w.customerName || "Không rõ tên",
          email: w.customerEmail || null,
          address: combineAddress(w.customerAddress, w.customerCity),
        },
      });
      customerId = created.id;
      warrantiesNoPhone++;
    }

    await prisma.warranty.create({
      data: {
        organizationId: organization.id,
        customerId,
        warrantyCode: w.warrantyCode,
        productName: w.productName,
        color: w.color || null,
        size: w.size || null,
        purchaseChannel: w.purchaseChannel || null,
        purchaseDate: toDate(w.purchaseDate),
        warrantyExpiry: toDate(w.warrantyExpiry),
        status: STATUS_MAP[w.status] ?? "ACTIVE",
        notes: w.notes || null,
        registeredAt: toDate(w.registeredAt) ?? new Date(),
      },
    });
    warrantiesCreated++;
  }

  console.log(
    `Khách hàng: ${customersFromCustomersJson} từ legacy-customers.json + ${extraCustomersFromWarranty} đối chiếu/tạo thêm từ legacy-warranties.json + ${warrantiesNoPhone} không có SĐT = ${customerIdByPhone.size + warrantiesNoPhone} tổng.`,
  );
  console.log(
    `Bảo hành: ${warrantiesCreated} tạo mới, ${warrantiesSkipped} bỏ qua (đã tồn tại theo warrantyCode — an toàn chạy lại script), ${junkSkipped} bỏ qua (dữ liệu rác/test).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
