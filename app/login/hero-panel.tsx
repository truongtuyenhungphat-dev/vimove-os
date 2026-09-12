import Image from "next/image";
import { LayoutDashboard, Package, ShoppingCart, Users2, Megaphone, Warehouse, FileBarChart, Bot } from "lucide-react";

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

function DashboardPreviewCard() {
  const C = 2 * Math.PI * 26;
  let acc = 0;
  return (
    <div className="w-[300px] overflow-hidden rounded-xl border border-black/5 bg-white text-neutral-900 shadow-2xl">
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
      {/* Decorative dot grid + glow — no real photograph available, so the
          "in context" feel comes from the dashboard preview card below
          instead of a background photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 size-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      <span className="relative flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
        <Image src="/logo-mark.png" alt="" aria-hidden="true" width={30} height={30} />
        VIMOVE <span className="text-primary">OS</span>
      </span>

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl leading-tight font-semibold text-white">
            Không gian làm việc thông minh.
            <br />
            Vận hành hiệu quả hơn.
          </h2>
          <p className="max-w-sm text-sm text-white/60">
            Kết nối sản phẩm, đội ngũ, dữ liệu và AI trong một nền tảng duy nhất.
          </p>
          <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] text-primary uppercase">
            <span className="h-px w-6 bg-primary" />
            Smart operations. Brighter growth.
          </p>
        </div>

        <DashboardPreviewCard />
      </div>
    </div>
  );
}
