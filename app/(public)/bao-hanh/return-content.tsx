// Nội dung thật, port nguyên văn từ cổng bảo hành Firebase cũ
// (chinh-sach-bao-hanh/index.html, tab "Đổi trả & Hoàn tiền").

import { CheckCircle2 } from "lucide-react";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 rounded-lg bg-neutral-700 px-4 py-2.5 text-sm font-bold text-white">{children}</h3>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2.5 mt-6 border-l-[3px] border-primary pl-2 text-sm font-bold text-primary">{children}</h4>;
}

function PolicyTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function ReturnContent() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground italic">Áp dụng cho toàn bộ sản phẩm mua tại cửa hàng và các kênh TMĐT của Vimove</p>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm font-semibold text-primary">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" aria-hidden="true" /> Đổi trả trong 30 ngày — không cần lý do</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" aria-hidden="true" /> Hoàn tiền 1–3 ngày làm việc</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" aria-hidden="true" /> Áp dụng mọi kênh mua hàng</span>
      </div>

      <section>
        <SectionTitle>I. Chính sách hoàn tiền</SectionTitle>
        <p className="mb-3 text-sm">Đối với các trường hợp hủy/trả đơn hàng, sau khi Vimove nhận và kiểm tra hàng hoàn trả, thời gian hoàn tiền được áp dụng theo hình thức thanh toán của khách hàng:</p>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left font-semibold text-muted-foreground">Hình thức thanh toán</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Thời gian hoàn tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3">Tiền mặt</td>
              <td className="border p-3">Hoàn ngay tại văn phòng</td>
            </tr>
            <tr>
              <td className="border p-3">Chuyển khoản / thẻ ATM / Visa / Mastercard / JCB</td>
              <td className="border p-3"><strong>1 – 3 ngày làm việc</strong> sau khi nhận và kiểm tra hàng trả</td>
            </tr>
            <tr>
              <td className="border p-3">Cổng thanh toán (MoMo / VNPAY / Kredivo…)</td>
              <td className="border p-3">7 – 15 ngày làm việc (theo chính sách của đơn vị quản lý cổng thanh toán)</td>
            </tr>
            <tr>
              <td className="border p-3">Sàn TMĐT (Shopee, TikTok Shop, Tiki, Lazada)</td>
              <td className="border p-3">Thực hiện theo quy định của từng sàn thương mại điện tử</td>
            </tr>
          </tbody>
        </PolicyTable>
      </section>

      <section>
        <SectionTitle>II. Chính sách đổi hàng &amp; trả hàng</SectionTitle>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="w-1/5 border p-3 text-left font-semibold text-muted-foreground">Điều kiện</th>
              <th className="w-2/5 border p-3 text-left font-semibold text-muted-foreground">Đổi hàng</th>
              <th className="w-2/5 border p-3 text-left font-semibold text-muted-foreground">Trả hàng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3 font-medium">Thời hạn áp dụng</td>
              <td className="border p-3">Trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng</td>
              <td className="border p-3">Trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng</td>
            </tr>
            <tr>
              <td className="border p-3 font-medium">Điều kiện sản phẩm</td>
              <td className="border p-3" colSpan={2}>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Sản phẩm mua tại cửa hàng hoặc các kênh TMĐT của Vimove</li>
                  <li>Chưa qua sử dụng</li>
                  <li>Còn nguyên tem, nhãn mác, hóa đơn, phụ kiện</li>
                  <li>Không bị dơ bẩn, trầy xước</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td className="border p-3 font-medium">Nguyên nhân</td>
              <td className="border p-3">Khách hàng muốn đổi sang sản phẩm khác trong vòng 30 ngày</td>
              <td className="border p-3">Khách hàng không muốn tiếp tục sử dụng sản phẩm</td>
            </tr>
            <tr>
              <td className="border p-3 font-medium">Không áp dụng</td>
              <td className="border p-3" colSpan={2}>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Sản phẩm đã qua sử dụng</li>
                  <li>Lỗi do khách hàng bảo quản sai cách</li>
                  <li>Sản phẩm khuyến mại đặc biệt, thanh lý (giảm giá từ 60% trở lên)</li>
                  <li>Thiếu phụ kiện / hóa đơn / phiếu bảo hành / SĐT từng mua hàng</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td className="border p-3 font-medium">Chi phí đổi trả</td>
              <td className="border p-3">
                <strong>Lỗi do nhà sản xuất:</strong> Vimove chịu toàn bộ chi phí.
                <br />
                <br />
                <strong>Khách đổi ý:</strong> khách hàng chịu phí vận chuyển 2 chiều + chi phí phát sinh khác (nếu có).
              </td>
              <td className="border p-3">
                <strong>Lỗi do nhà sản xuất:</strong> Vimove chịu toàn bộ chi phí.
                <br />
                <br />
                <strong>Khách đổi ý:</strong> khách hàng chịu phí vận chuyển + chi phí phát sinh khác (nếu có).
              </td>
            </tr>
            <tr>
              <td className="border p-3 font-medium">Hình thức xử lý</td>
              <td className="border p-3">
                Đổi sang sản phẩm tương đương hoặc có giá trị cao hơn.
                <br />
                Nếu sản phẩm mới có giá trị thấp hơn sản phẩm cũ: không hoàn tiền chênh lệch.
              </td>
              <td className="border p-3">Bộ phận CSKH hoàn tiền trong <strong>1 – 3 ngày làm việc</strong> sau khi nhận và kiểm tra hàng trả.</td>
            </tr>
          </tbody>
        </PolicyTable>

        <SubTitle>Quy trình xử lý</SubTitle>
        <p className="mb-3 text-sm">Khách hàng liên hệ bộ phận CSKH Vimove để trao đổi và xác nhận quy trình đổi/trả hàng phù hợp nhất với nhu cầu, theo một trong hai cách sau:</p>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="w-1/2 border p-3 text-center font-semibold text-muted-foreground">Cách 1 — Đổi/trả trực tiếp tại văn phòng Vimove</th>
              <th className="w-1/2 border p-3 text-center font-semibold text-muted-foreground">Cách 2 — Đổi/trả tại nhà hoặc địa điểm theo nhu cầu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3 align-top">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>Bước 1:</strong> Khách hàng liên hệ và xác nhận thông tin đơn hàng, thời gian, sản phẩm cần đổi/trả với bộ phận CSKH.</li>
                  <li><strong>Bước 2:</strong> Bộ phận CSKH kiểm tra, xác nhận thông tin đơn hàng đổi trả là chính xác và hợp lệ.</li>
                  <li><strong>Bước 3:</strong> Khách hàng mang sản phẩm trực tiếp tới văn phòng Vimove, hoàn thiện thủ tục đổi/trả và thanh toán phí chênh lệch (nếu có, với trường hợp đổi hàng).</li>
                  <li><strong>Bước 4:</strong> Nhân viên tiếp nhận sản phẩm trả, kiểm tra, xác nhận với bộ phận CSKH và hoàn tiền cho khách hàng (với trường hợp trả hàng). Hoàn tất quy trình.</li>
                </ul>
              </td>
              <td className="border p-3 align-top">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>Bước 1:</strong> Khách hàng liên hệ và xác nhận thông tin đơn hàng, thời gian, sản phẩm cần đổi/trả với bộ phận CSKH.</li>
                  <li><strong>Bước 2:</strong> Bộ phận CSKH kiểm tra, xác nhận và tạo đơn: gửi sản phẩm mới tới khách hàng (đổi hàng) hoặc thu hồi sản phẩm từ khách hàng (trả hàng).</li>
                  <li><strong>Bước 3:</strong> Đơn vị vận chuyển giao hàng mới và thu phí chênh lệch nếu có (đổi hàng), hoặc lấy hàng từ khách chuyển về kho theo thông tin trên đơn thu hồi (trả hàng).</li>
                  <li><strong>Bước 4:</strong> Kho nhận hàng trả, xác nhận và đề nghị bộ phận CSKH hoàn tiền cho khách hàng (nếu là trả hàng).</li>
                  <li><strong>Bước 5:</strong> Bộ phận CSKH hoàn tiền vào tài khoản của khách hàng, hoàn tất quy trình.</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </PolicyTable>
      </section>
    </div>
  );
}
