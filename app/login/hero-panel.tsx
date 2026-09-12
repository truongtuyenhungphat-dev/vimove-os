import Image from "next/image";
import { LayoutDashboard, Package, ShoppingCart, Users2, Megaphone, Warehouse, FileBarChart, Bot, ShieldCheck, Workflow, Radio } from "lucide-react";

// Always dark regardless of the app's light/dark theme — a deliberate,
// fixed marketing-panel look (like the reference design), not something
// that should flip with the visitor's OS preference the way the app UI
// itself does. Literal dark colors instead of the theme-following
// --sidebar token, which is WHITE in light mode.
const NAV_ITEMS = [
  { label: "Tổng quan", icon: LayoutDashboard, active: true },
  { label: "Sản phẩm", icon: Package },
  { label: "Đơn hàng", icon: ShoppingCart },
  { label: "Khách hàng", icon: Users2 },
  { label: "Marketing", icon: Megaphone },
  { label: "Kho vận", icon: Warehouse },
  { label: "Báo cáo", icon: FileBarChart },
  { label: "AI Assistant", icon: Bot },
];

const STATS = [
  { label: "Tổng đơn hàng", value: "1,284", delta: "+12%" },
  { label: "Doanh thu", value: "2.8 tỷ", delta: "+18%" },
  { label: "Khách hàng mới", value: "456", delta: "+24%" },
  { label: "Sản phẩm", value: "320", delta: "+6%" },
];

const CHANNELS = [
  { label: "Website", pct: 45, color: "#2563eb" },
  { label: "Shopee", pct: 29, color: "#f97316" },
  { label: "Tiktok Shop", pct: 18, color: "#111827" },
  { label: "Khác", pct: 9, color: "#94a3b8" },
];

const FEATURE_CHIPS = [
  { label: "Bảo mật phân quyền", icon: ShieldCheck },
  { label: "Tự động hoá quy trình", icon: Workflow },
  { label: "Dữ liệu thời gian thực", icon: Radio },
];

function DashboardPreviewCard() {
  const C = 2 * Math.PI * 26;
  let acc = 0;
  return (
    <div
      className="w-[300px] -rotate-2 overflow-hidden rounded-xl border border-black/5 bg-white text-neutral-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-transform duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 hover:rotate-0"
      style={{ animationDuration: "700ms", animationDelay: "150ms", animationFillMode: "backwards" }}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-tight">
          <Image src="/logo-mark.png" alt="" aria-hidden="true" width={14} height={14} />
          VIMOVE OS
        </span>
        <span className="size-4 rounded-full bg-neutral-200" />
      </div>
      <div className="flex">
        <div className="flex w-[74px] shrink-0 flex-col gap-0.5 border-r p-1.5">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <span
              key={label}
              className={`flex items-center gap-1 rounded px-1 py-0.5 text-[8px] leading-tight ${
                active ? "bg-primary/10 font-medium text-primary" : "text-neutral-500"
              }`}
            >
              <Icon className="size-2.5 shrink-0" aria-hidden />
              {label}
            </span>
          ))}
        </div>
        <div className="flex-1 space-y-2 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-md border bg-neutral-50 px-1.5 py-1">
                <p className="text-[7px] text-neutral-500">{s.label}</p>
                <p className="text-[11px] font-semibold">{s.value}</p>
                <p className="text-[7px] font-medium text-emerald-600">▲ {s.delta}</p>
              </div>
            ))}
          </div>
          <div className="rounded-md border p-1.5">
            <p className="mb-1 text-[7px] text-neutral-500">Doanh thu theo tháng</p>
            <svg viewBox="0 0 120 30" className="h-6 w-full text-primary">
              <polyline
                points="0,24 15,18 30,20 45,12 60,15 75,8 90,10 105,4 120,6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="rounded-md border p-1.5">
            <p className="mb-1 text-[7px] text-neutral-500">Kênh bán hàng</p>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 64 64" className="size-9 shrink-0 -rotate-90">
                {CHANNELS.map((c) => {
                  const frac = c.pct / 100;
                  const seg = (
                    <circle
                      key={c.label}
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke={c.color}
                      strokeWidth="8"
                      strokeDasharray={`${frac * C} ${C}`}
                      strokeDashoffset={-acc * C}
                    />
                  );
                  acc += frac;
                  return seg;
                })}
              </svg>
              <div className="flex flex-1 flex-col gap-0.5">
                {CHANNELS.map((c) => (
                  <span key={c.label} className="flex items-center gap-1 text-[7px] text-neutral-600">
                    <span className="size-1.5 rounded-full" style={{ background: c.color }} />
                    {c.label} {c.pct}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginHeroPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:w-[55%] lg:flex-col lg:justify-between lg:p-12">
      {/* Aurora trôi chậm (2 khối màu, lệch pha nhau) + lớp grain mảnh phủ trên
          cùng — thay cho 2 vòng glow tĩnh của bản trước, tạo cảm giác "phần
          mềm hiện đại 2026" thay vì chỉ là nền tối phẳng. Không có ảnh chụp
          sản phẩm thật nên vẫn dựa vào DashboardPreviewCard bên dưới để gợi
          bối cảnh, thay vì ảnh nền. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay bg-grain-overlay" />
      <div
        aria-hidden
        className="animate-login-aurora-a pointer-events-none absolute -top-24 -right-24 size-[32rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="animate-login-aurora-b pointer-events-none absolute -bottom-40 -left-20 size-[30rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.18 305), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <span className="relative flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
        <Image src="/logo-mark.png" alt="" aria-hidden="true" width={30} height={30} />
        VIMOVE <span className="text-primary">OS</span>
      </span>

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-[0.1em] text-primary uppercase backdrop-blur-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Smart operations. Brighter growth.
          </p>
          <h2 className="max-w-md text-4xl leading-[1.15] font-semibold tracking-tight text-white text-balance">
            Không gian làm việc thông minh.{" "}
            <span className="bg-gradient-to-r from-primary to-sky-300 bg-clip-text text-transparent">
              Vận hành hiệu quả hơn.
            </span>
          </h2>
          <p className="max-w-sm text-sm text-white/60">
            Kết nối sản phẩm, đội ngũ, dữ liệu và AI trong một nền tảng duy nhất.
          </p>
        </div>

        <DashboardPreviewCard />

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {FEATURE_CHIPS.map(({ label, icon: Icon }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/50">
              <Icon className="size-3.5 text-primary" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
