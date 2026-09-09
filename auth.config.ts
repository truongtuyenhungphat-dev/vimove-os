import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe, dùng cho middleware.ts. KHÔNG được import Prisma ở đây —
 * Prisma Client (kể cả driver adapter) dùng Node.js builtin (node:path, node:url)
 * không chạy được trên Edge Runtime mà middleware mặc định sử dụng. Credentials
 * provider (cần Prisma để tra cứu user) chỉ khai báo ở auth.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
};
