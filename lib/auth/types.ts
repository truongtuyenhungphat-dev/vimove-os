import type { PermissionKey } from "@/lib/permissions/catalog";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      departmentId: string | null;
      roleKeys: string[];
      permissions: PermissionKey[];
      // Phase 10 — Scale: scope hẹp nhất/rộng nhất mà user có cho permission trong
      // SCOPABLE_PERMISSIONS (lib/permissions/catalog.ts) — "ALL" | "DEPARTMENT" | "OWN".
      // Permission không có entry ở đây coi như "ALL" (đọc qua getPermissionScope()).
      permissionScopes: Record<string, string>;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

}

// JWT (next-auth/jwt) đã là `Record<string, unknown>` sẵn nên không cần augment —
// các field tuỳ biến (userId, organizationId, departmentId, roleKeys, permissions,
// permissionScopes) đọc/ghi qua `as` cast tại auth.ts.
