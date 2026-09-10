import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";
import { LoginHeroPanel } from "./hero-panel";

export const metadata: Metadata = { title: "Đăng nhập — VIMOVE OS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-1 lg:hidden">
            <span className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Image src="/logo-mark.png" alt="" aria-hidden="true" width={28} height={28} priority />
              VIMOVE <span className="text-primary">OS</span>
            </span>
            <p className="text-sm text-muted-foreground">Business Operating System</p>
          </div>

          <div className="mb-6">
            <h1 className="text-lg font-semibold">Chào mừng trở lại</h1>
            <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục làm việc cùng VIMOVE OS</p>
          </div>

          <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} googleEnabled={!!process.env.AUTH_GOOGLE_ID} />
        </div>
      </div>

      <LoginHeroPanel />
    </div>
  );
}
