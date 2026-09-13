import Image from "next/image";
import { LayoutDashboard, Package, ShoppingCart, Users2, Megaphone, Warehouse, FileBarChart, Bot, ShieldCheck, Workflow, Radio } from "lucide-react";

// Xanh dương thương hiệu cố định cho panel LUÔN TỐI này — cùng hue (263) với
// --primary của hệ thống nhưng lightness cao hơn (0.7 thay vì 0.49/0.63),
// tương đương mức dùng cho chữ/icon trên nền tối bất kể app đang ở light hay
// dark mode. Không dùng thẳng class `text-primary` ở đây vì --primary theo
// theme: ở light mode nó là oklch(0.49 0.165 263) — đủ tương phản trên nền
// gần đen phẳng, nhưng bị chìm khi rơi vào vùng sáng của ảnh nền văn phòng.
const LOGIN_ACCENT = "oklch(0.7 0.15 263)";

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
      className="w-[300px] -rotate-2 overflow-hidden rounded-xl border border-black/5 bg-white text-neutral-900 shadow-[0_35px_70px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 transition-transform duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 hover:rotate-0"
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
      {/* Ảnh văn phòng thật (public/login-office-hero.jpg) thay cho nền tối +
          aurora trừu tượng của bản trước — chủ doanh nghiệp muốn cảm giác
          "không gian làm việc hiện đại" thật hơn thay vì gradient trôi. Ảnh
          gốc 1200×1500 (dựng bằng model miễn phí, hơi mềm chi tiết khi phóng
          to trên màn hình lớn) nên được kéo hơi tối + phủ grain nhẹ để che
          bớt độ mềm đó, thay vì để lộ nguyên ảnh sắc nét ở kích thước lớn.
          object-position lệch xuống dưới một chút để giữ bàn làm việc/ghế/
          cửa sổ trong khung thay vì mảng tường trống phía trên ảnh.
          Luôn tối cố định — KHÔNG đổi theo theme sáng/tối của app, giữ đúng
          chủ đích ban đầu của panel này (marketing panel cố định, không theo
          OS preference của người xem). */}
      <Image
        src="/login-office-hero.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="(min-width: 1024px) 55vw, 0px"
        className="object-cover object-[center_38%]"
      />

      {/* Scrim 2 lớp: (1) tối dần từ trên xuống — nhạt nhất ngay dưới logo
          (~9-16%) để lộ khung cửa sổ/cây xanh, rồi tối trở lại chắc chắn từ
          chỗ badge bắt đầu (~22%) trở xuống hết panel, đậm dần về phía dưới
          nơi đặt headline/card/chip; (2) tối nhẹ bên trái nơi khối chữ căn
          trái, nhạt dần sang phải để vẫn lộ phần sáng nhất của ảnh (cửa sổ).
          Mốc % ở đây khớp với vị trí thực tế của badge/headline/card trong
          layout justify-between bên dưới — đừng đổi bố cục mà không xét lại
          các mốc này. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,11,18,0.5) 0%, rgba(8,11,18,0.3) 13%, rgba(8,11,18,0.52) 24%, rgba(8,11,18,0.62) 45%, rgba(8,11,18,0.72) 68%, rgba(6,9,15,0.93) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(5,8,14,0.4) 0%, rgba(5,8,14,0.1) 48%, transparent 68%)" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay bg-grain-overlay" />

      <span className="relative flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
        <Image src="/logo-mark.png" alt="" aria-hidden="true" width={30} height={30} />
        VIMOVE <span style={{ color: LOGIN_ACCENT }}>OS</span>
      </span>

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          {/* Nền chip cố định tối (bg-black/30) thay vì bg-white/10 trong suốt —
              đảm bảo chữ luôn đọc được kể cả khi rơi vào vùng sáng của ảnh
              (tường/cửa sổ), không phụ thuộc hoàn toàn vào lớp scrim phía sau.
              Màu chữ/chấm accent dùng giá trị xanh dương cố định (không phải
              class text-primary theo theme) vì panel này luôn tối — nếu app
              đang ở light mode, --primary là tông xanh đậm hơn dành cho nền
              sáng, sẽ bị chìm trên nền tối/ảnh của panel này. */}
          <p
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-medium tracking-[0.1em] uppercase backdrop-blur-md"
            style={{ color: LOGIN_ACCENT }}
          >
            <span className="size-1.5 animate-pulse rounded-full" style={{ backgroundColor: LOGIN_ACCENT }} />
            Smart operations. Brighter growth.
          </p>
          <h2 className="max-w-md text-4xl leading-[1.15] font-semibold tracking-tight text-white text-balance">
            Không gian làm việc thông minh.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${LOGIN_ACCENT}, oklch(0.78 0.1 220))` }}
            >
              Vận hành hiệu quả hơn.
            </span>
          </h2>
          <p className="max-w-sm text-sm text-white/70">
            Kết nối sản phẩm, đội ngũ, dữ liệu và AI trong một nền tảng duy nhất — như thể đội ngũ của bạn đang cùng
            làm việc trong một không gian.
          </p>
        </div>

        <DashboardPreviewCard />

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {FEATURE_CHIPS.map(({ label, icon: Icon }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/60">
              <Icon className="size-3.5" style={{ color: LOGIN_ACCENT }} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
