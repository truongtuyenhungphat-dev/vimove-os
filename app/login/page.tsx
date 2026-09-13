import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";
import { LoginHeroPanel } from "./hero-panel";
import { APP_VERSION, APP_CREDIT } from "@/lib/version";

export const metadata: Metadata = { title: "Đăng nhập — VIMOVE OS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10">
        {/* Glow nền rất mờ phía sau card — cùng tông primary với panel tối bên
            cạnh, tạo cảm giác 2 nửa trang thuộc cùng một hệ thống thay vì
            trắng phẳng đột ngột. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />

        <div className="relative w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="mb-8 flex flex-col gap-1 lg:hidden">
            <span className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Image src="/logo-mark.png" alt="" aria-hidden="true" width={28} height={28} priority />
              VIMOVE <span className="text-primary">OS</span>
            </span>
            <p className="text-sm text-muted-foreground">Business Operating System</p>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight">Chào mừng trở lại</h1>
            <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để tiếp tục làm việc cùng VIMOVE OS</p>
          </div>

          <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} googleEnabled={!!process.env.AUTH_GOOGLE_ID} />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} VIMOVE OS. All rights reserved.
          </p>
          <p className="mt-1 text-center text-[11px] text-muted-foreground/70">
            Ver {APP_VERSION} · {APP_CREDIT}
          </p>
        </div>
      </div>

      <LoginHeroPanel />
    </div>
  );
}
