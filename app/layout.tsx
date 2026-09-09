import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

// Be Vietnam Pro — tối ưu dấu tiếng Việt, giữ vẻ hiện đại (gợi ý từ skill ui-ux-pro-max
// cho sản phẩm nội bộ tiếng Việt). Thay Geist Sans (đã dùng ở Phase 1).
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIMOVE OS",
  description: "VIMOVE OS — Business Operating System: Work, Process, Marketing, CRM/Sales, Analytics, AI.",
  // Phase 10 — Scale: PWA. `manifest` tự trỏ tới app/manifest.ts, `appleWebApp` bật
  // chế độ standalone khi cài trên iOS (Safari không đọc `display` trong manifest).
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "VIMOVE OS" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Token .dark đã có sẵn trong globals.css — ThemeProvider chỉ vừa được nối để
         * bật/tắt qua UI (components/layout/theme-toggle.tsx), không đổi token nào. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
            <ServiceWorkerRegister />
            <InstallPrompt />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
