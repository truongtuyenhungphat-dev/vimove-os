import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Liên hệ — Vimove" };

const CONTACT_CARDS = [
  { icon: MapPin, title: "Địa chỉ văn phòng", lines: ["Tầng 5, Toà nhà Hoa Đăng", "Số 290 Nguyễn Trãi, Phường Đại Mỗ", "Thành phố Hà Nội, Việt Nam"] },
  { icon: Phone, title: "Hotline tư vấn", lines: ["0988 512 352", "Thứ 2 – Chủ nhật: 8:00 – 21:00"] },
  { icon: Mail, title: "Email", lines: ["info@vimove.com.vn", "Phản hồi trong vòng 2–4 giờ làm việc"] },
  { icon: Clock, title: "Giờ làm việc", lines: ["Thứ 2 – Thứ 6: 8:00 – 21:00", "Thứ 7: 8:00 – 20:00", "Chủ nhật: 9:00 – 18:00"] },
];

const FAQS = [
  { q: "Vimove có giao hàng toàn quốc không?", a: "Có, Vimove giao hàng đến tất cả 63 tỉnh thành trong cả nước. Thời gian giao hàng thông thường 2–4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ 500.000đ." },
  { q: "Chính sách đổi trả như thế nào?", a: "Vimove hỗ trợ đổi trả trong vòng 30 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi từ nhà sản xuất. Sản phẩm cần còn nguyên tem, nhãn và hoá đơn mua hàng." },
  { q: "Vimove có hỗ trợ mua số lượng lớn / đại lý không?", a: "Có! Chúng tôi có chính sách giá ưu đãi đặc biệt cho đơn hàng số lượng lớn và đại lý phân phối. Vui lòng liên hệ hotline 0988 512 352 để được tư vấn chi tiết." },
  { q: "Vali có được bảo hành không?", a: "Tất cả sản phẩm Vimove đều được bảo hành chính hãng 24 tháng. Bảo hành bao gồm: lỗi khoá kéo, bánh xe, khoá TSA, thanh kéo và vỏ vali do lỗi sản xuất." },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Liên Hệ Với Chúng Tôi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đội ngũ tư vấn nhiệt tình, sẵn sàng hỗ trợ bạn 8:00 – 21:00 mỗi ngày</p>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONTACT_CARDS.map(({ icon: Icon, title, lines }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <div className="mt-1.5 flex flex-col gap-0.5 text-sm text-muted-foreground">
              {lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-1 text-lg font-semibold">Gửi Yêu Cầu Tư Vấn</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại trong vòng 30 phút (giờ hành chính).
          </p>
          <ContactForm />
        </div>

        <div>
          <h2 className="mb-5 text-lg font-semibold">Câu Hỏi Thường Gặp</h2>
          <div className="flex flex-col divide-y rounded-xl border bg-card">
            {FAQS.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                  <span className="flex items-center justify-between gap-2">
                    {f.q}
                    <span className="shrink-0 text-muted-foreground transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
