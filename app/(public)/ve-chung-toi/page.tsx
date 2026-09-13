import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Heart, Leaf, Package, Wallet, Wrench, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Về chúng tôi — Vimove" };

const STATS = [
  { value: "10K+", label: "Khách hàng tin tưởng" },
  { value: "50+", label: "Mẫu sản phẩm" },
  { value: "63", label: "Tỉnh thành giao hàng" },
  { value: "4.9★", label: "Điểm đánh giá trung bình" },
];

const CORE_VALUES = [
  { icon: Trophy, title: "Chất Lượng Hàng Đầu", desc: "Mỗi sản phẩm đều được kiểm tra nghiêm ngặt trước khi đến tay khách hàng. Chúng tôi không bao giờ thỏa hiệp về chất lượng." },
  { icon: Heart, title: "Khách Hàng Là Trung Tâm", desc: "Sự hài lòng của khách hàng là thước đo thành công của chúng tôi. Mọi quyết định đều hướng đến lợi ích của bạn." },
  { icon: Leaf, title: "Phát Triển Bền Vững", desc: "Vimove cam kết phát triển kinh doanh song hành với trách nhiệm với môi trường và cộng đồng xã hội." },
];

const COMMITMENTS = [
  { icon: Package, title: "Đóng Gói Cẩn Thận", desc: "Mỗi sản phẩm được đóng gói kỹ lưỡng, có lớp bảo vệ chống va đập trong quá trình vận chuyển." },
  { icon: Wallet, title: "Giá Cạnh Tranh Nhất", desc: "Cam kết hoàn tiền nếu bạn tìm thấy giá rẻ hơn cho sản phẩm chất lượng tương đương." },
  { icon: Wrench, title: "Bảo Hành Tận Tâm", desc: "Trung tâm bảo hành trên toàn quốc, hỗ trợ sửa chữa và thay thế linh kiện miễn phí." },
  { icon: Smartphone, title: "Hỗ Trợ Đa Kênh", desc: "Tư vấn qua điện thoại, Zalo, Facebook, email — luôn sẵn sàng giải đáp mọi thắc mắc." },
];

const COMPANY_INFO = [
  ["Tên công ty", "CÔNG TY CỔ PHẦN THƯƠNG MẠI VIMOVE VIỆT NAM"],
  ["Tên tiếng Anh", "VIMOVE VIETNAM TRADING JOINT STOCK COMPANY"],
  ["Mã số thuế", "0111462056"],
  ["Địa chỉ", "Tầng 5, Toà nhà Hoa Đăng, số 290 Nguyễn Trãi, Phường Đại Mỗ, TP Hà Nội"],
  ["Người đại diện", "Lê Thị Anh Thái"],
  ["Điện thoại", "0988 512 352"],
  ["Website", "vimove.com.vn"],
  ["Ngày hoạt động", "14/04/2026"],
  ["Tình trạng", "Đang hoạt động"],
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero tối "aurora" — cùng ngôn ngữ thị giác với app/login (xem hero-panel.tsx +
       * keyframes trong globals.css) để trang công khai và hệ thống nội bộ nhất quán. */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-16 text-white sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay bg-grain-overlay" />
        <div
          aria-hidden
          className="animate-login-aurora-a pointer-events-none absolute -top-24 -left-24 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="animate-login-aurora-b pointer-events-none absolute -bottom-32 -right-16 size-[26rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.18 305), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">Câu chuyện của chúng tôi</p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Vimove — Khởi Đầu Từ Đam Mê Du Lịch</h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
            Vimove được thành lập năm 2026 với sứ mệnh mang đến cho người Việt những chiếc vali chất lượng cao, thiết
            kế đẹp mắt với mức giá hợp lý nhất thị trường.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Chúng tôi hiểu rằng một chiếc vali không chỉ là đồ vật chứa đựng hành lý — đó là người bạn đồng hành đáng
            tin cậy trong mọi chuyến đi, là biểu hiện của phong cách sống và tình yêu du lịch của bạn.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button render={<Link href="/san-pham" />} size="lg">
              Xem sản phẩm
            </Button>
            <Button render={<Link href="/lien-he" />} size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Liên hệ ngay
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-semibold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold sm:text-2xl">Giá Trị Cốt Lõi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Những giá trị định hướng mọi hoạt động của Vimove</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {CORE_VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="mb-6 text-center text-xl font-semibold sm:text-2xl">Thông Tin Công Ty</h2>
          <dl className="divide-y rounded-xl border bg-card">
            {COMPANY_INFO.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="col-span-2 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-center text-xl font-semibold sm:text-2xl">Cam Kết Của Vimove</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
