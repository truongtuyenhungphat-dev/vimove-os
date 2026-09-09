import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { LandingPageStatus } from "@/lib/marketing/types";

export async function listLandingPages(organizationId: string) {
  return prisma.landingPage.findMany({
    where: { organizationId },
    include: { campaign: { select: { id: true, name: true } }, _count: { select: { forms: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLandingPage(organizationId: string, id: string) {
  return prisma.landingPage.findFirst({
    where: { id, organizationId },
    include: { forms: { include: { _count: { select: { submissions: true } } } } },
  });
}

/** Dùng cho route công khai `/lp/[slug]` — KHÔNG kiểm tra RBAC (khách vãng lai xem
 * được), chỉ trả trang đã PUBLISHED. Route công khai không có session nên không biết
 * organizationId — tra theo slug toàn cục. `slug` chỉ unique trong 1 organization
 * (`@@unique([organizationId, slug])`), nên nếu sau này multi-tenant thật với nhiều
 * organization cùng dùng landing page công khai, cần thêm prefix org vào URL (vd
 * `/lp/[orgSlug]/[slug]`) — ngoài phạm vi khi hệ thống mới seed 1 organization duy
 * nhất (§ ghi chú README "Single-organization").
 */
export async function getPublishedLandingPageBySlugGlobal(slug: string) {
  return prisma.landingPage.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { forms: true },
  });
}

export async function createLandingPage(
  organizationId: string,
  actorId: string,
  data: { name: string; slug: string; campaignId?: string | null; headline: string; body?: string | null; ctaLabel?: string | null; ctaUrl?: string | null }
) {
  // Tự tạo sẵn 1 LandingForm mặc định (Họ tên/Email/SĐT) — trang công khai luôn có
  // form thu lead thật ngay khi tạo, không cần form-builder riêng (ngoài phạm vi).
  const page = await prisma.landingPage.create({
    data: {
      organizationId,
      name: data.name,
      slug: data.slug,
      campaignId: data.campaignId || null,
      headline: data.headline,
      body: data.body || null,
      ctaLabel: data.ctaLabel || null,
      ctaUrl: data.ctaUrl || null,
      createdById: actorId,
      forms: {
        create: [
          {
            name: "Đăng ký nhận tư vấn",
            fields: [
              { key: "name", label: "Họ tên", type: "text", required: true },
              { key: "email", label: "Email", type: "email", required: true },
              { key: "phone", label: "Số điện thoại", type: "phone", required: false },
            ],
          },
        ],
      },
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "landing_page.create", entityType: "LandingPage", entityId: page.id, after: { slug: page.slug } });
  return page;
}

export async function updateLandingPage(
  organizationId: string,
  actorId: string,
  id: string,
  data: { name: string; status: LandingPageStatus; campaignId?: string | null; headline: string; body?: string | null; ctaLabel?: string | null; ctaUrl?: string | null }
) {
  const before = await prisma.landingPage.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy landing page");
  const updated = await prisma.landingPage.update({
    where: { id },
    data: {
      name: data.name,
      status: data.status,
      campaignId: data.campaignId || null,
      headline: data.headline,
      body: data.body || null,
      ctaLabel: data.ctaLabel || null,
      ctaUrl: data.ctaUrl || null,
    },
  });
  await writeAuditLog({ organizationId, actorId, action: "landing_page.update", entityType: "LandingPage", entityId: id, before: { status: before.status }, after: { status: updated.status } });
  return updated;
}

export async function deleteLandingPage(organizationId: string, actorId: string, id: string) {
  const before = await prisma.landingPage.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy landing page");
  await prisma.landingPage.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "landing_page.delete", entityType: "LandingPage", entityId: id, before: { slug: before.slug } });
}

export type FormFieldDef = { key: string; label: string; type: "text" | "email" | "phone" | "textarea"; required?: boolean };

export async function addForm(landingPageId: string, data: { name: string; fields: FormFieldDef[] }) {
  return prisma.landingForm.create({ data: { landingPageId, name: data.name, fields: data.fields as object } });
}

export async function removeForm(id: string) {
  await prisma.landingForm.delete({ where: { id } });
}

/** Submit thật từ trang công khai — KHÔNG cần đăng nhập, KHÔNG kiểm tra RBAC (đúng
 * bản chất form thu lead công khai). */
export async function submitForm(landingFormId: string, data: Record<string, string>) {
  const form = await prisma.landingForm.findUnique({
    where: { id: landingFormId },
    include: { landingPage: { select: { organizationId: true } } },
  });
  if (!form) throw new Error("Form không tồn tại");
  const submission = await prisma.formSubmission.create({ data: { landingFormId, data } });
  return { submission, organizationId: form.landingPage.organizationId };
}

export async function listSubmissions(landingFormId: string) {
  return prisma.formSubmission.findMany({ where: { landingFormId }, orderBy: { submittedAt: "desc" } });
}
