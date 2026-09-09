import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { PermissionKey } from "@/lib/permissions/catalog";
import type { Session } from "next-auth";

/**
 * RBAC luôn kiểm tra ở server (§21: "RBAC kiểm tra server-side; UI chỉ là lớp UX").
 * Mọi Server Action / Route Handler / Server Component đọc dữ liệu nhạy cảm phải
 * gọi qua các hàm dưới đây thay vì tự đọc session.user.permissions trực tiếp.
 */

export async function getSession(): Promise<Session | null> {
  return auth();
}

/** Bắt buộc đã đăng nhập — dùng ở Server Component/Server Action cần user hiện tại. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export function hasPermission(session: Session | null, key: PermissionKey): boolean {
  return session?.user?.permissions?.includes(key) ?? false;
}

/**
 * Phase 10 — Scale: trả về scope thật của user cho 1 permission (ALL/DEPARTMENT/OWN)
 * — dùng để lọc row ở tầng service (vd `listAllTasks`, `listLeads`), KHÔNG thay thế
 * `hasPermission`/`requirePermission` (scope chỉ thu hẹp thêm sau khi đã có quyền
 * gốc). User không có permission → coi như không có gì để lọc (service tự
 * `assertPermission` trước đó rồi nên trường hợp này không nên xảy ra ở luồng thật).
 */
export type ResourceScope = "ALL" | "DEPARTMENT" | "OWN";
export function getPermissionScope(session: Session | null, key: PermissionKey): ResourceScope {
  const scope = session?.user?.permissionScopes?.[key];
  return scope === "DEPARTMENT" || scope === "OWN" ? scope : "ALL";
}

/**
 * Dựng object visibility dùng chung cho mọi service list có tham số `visibility`
 * dạng `{ scope, userId, departmentId }` (vd `listAllTasks`, `services/crm/leads.ts`).
 * Gọi ở Server Component/Action sau khi đã có session, KHÔNG gọi trong service layer.
 */
export function buildVisibilityScope(session: Session, key: PermissionKey) {
  return {
    scope: getPermissionScope(session, key),
    userId: session.user.id,
    departmentId: session.user.departmentId,
  };
}

/**
 * Bắt buộc user hiện tại có permission `key`, ngược lại redirect về /dashboard
 * kèm query `?denied=1` để trang hiện Permission Denied state.
 */
export async function requirePermission(key: PermissionKey): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session, key)) {
    redirect(`/dashboard?denied=${encodeURIComponent(key)}`);
  }
  return session;
}

/** Dùng trong Server Action: trả lỗi có thể hiển thị cho UI thay vì redirect cứng. */
export async function assertPermission(key: PermissionKey): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session, key)) {
    throw new Error(`FORBIDDEN: thiếu quyền "${key}"`);
  }
  return session;
}
