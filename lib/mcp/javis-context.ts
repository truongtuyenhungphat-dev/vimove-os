import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";

// Cache trong bộ nhớ của tiến trình (instance Vercel còn "ấm" thì dùng lại,
// cold start thì tự tra lại — cùng cách các route cron/webhook đang resolve
// organizationId, không cần store ngoài).
let cachedOrgId: string | null = null;
let cachedActorId: string | null = null;

/** organizationId của tổ chức "vimove" — hệ thống hiện chỉ có 1 tổ chức, cùng
 * quy ước với app/api/cron/channel-scrape/route.ts. */
export async function getVimoveOrgId(): Promise<string> {
  if (cachedOrgId) return cachedOrgId;
  const org = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!org) throw new Error("Không tìm thấy tổ chức 'vimove'");
  cachedOrgId = org.id;
  return cachedOrgId;
}

/** User hệ thống đại diện cho Javis khi gọi các hàm service yêu cầu actorId
 * thật (ghi AuditLog, ownerId trên Order/Customer...). Tạo một lần, idempotent
 * theo email. Không dùng để đăng nhập — passwordHash chỉ để thoả schema. */
export async function getJavisActorId(): Promise<string> {
  if (cachedActorId) return cachedActorId;

  const email = process.env.JAVIS_MCP_ACTOR_EMAIL || "javis@vimove.internal";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    cachedActorId = existing.id;
    return cachedActorId;
  }

  const organizationId = await getVimoveOrgId();
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  const created = await prisma.user.create({
    data: {
      organizationId,
      email,
      passwordHash,
      name: "Javis AI",
      status: "ACTIVE",
    },
  });
  cachedActorId = created.id;
  return cachedActorId;
}
