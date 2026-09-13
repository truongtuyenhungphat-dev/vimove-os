import Image from "next/image";
import { ShieldCheck, Workflow, Radio } from "lucide-react";

// Xanh dương thương hiệu cố định cho panel LUÔN TỐI này — cùng hue (263) với
// --primary của hệ thống nhưng lightness cao hơn (0.7 thay vì 0.49/0.63),
// tương đương mức dùng cho chữ/icon trên nền tối bất kể app đang ở light hay
// dark mode. Không dùng thẳng class `text-primary` ở đây vì --primary theo
// theme: ở light mode nó là oklch(0.49 0.165 263) — đủ tương phản trên nền
// gần đen phẳng, nhưng bị chìm khi rơi vào vùng sáng của ảnh nền văn phòng.
const LOGIN_ACCENT = "oklch(0.7 0.15 263)";

const FEATURE_CHIPS = [
  { label: "Bảo mật phân quyền", icon: ShieldCheck },
  { label: "Tự động hoá quy trình", icon: Workflow },
  { label: "Dữ liệu thời gian thực", icon: Radio },
];

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

      {/* Scrim 2 lớp: (1) tối dần từ trên xuống, nhạt nhất ở giữa panel — chỗ
          để lộ rõ nhất bàn làm việc/ghế/cây xanh của ảnh (không còn bị che
          bởi DashboardPreviewCard như bản trước, ảnh cần được "thấy" rõ hơn
          theo đúng yêu cầu) — rồi tối dần trở lại ở dưới cùng, nơi đặt đoạn
          mô tả + feature chip, để chữ luôn đọc rõ; (2) tối nhẹ bên trái nơi
          khối chữ căn trái, nhạt dần sang phải để vẫn lộ phần sáng nhất của
          ảnh (cửa sổ). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,11,18,0.55) 0%, rgba(8,11,18,0.15) 22%, rgba(8,11,18,0.1) 45%, rgba(8,11,18,0.45) 70%, rgba(6,9,15,0.82) 100%)",
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
