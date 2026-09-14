// Nội dung thật, port nguyên văn từ cổng bảo hành Firebase cũ
// (chinh-sach-bao-hanh/index.html, tab "Chính sách bảo hành") — chỉ đổi cách
// trình bày (bảng/HTML thô → component Tailwind), không đổi nội dung/số liệu.

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 rounded-lg bg-neutral-700 px-4 py-2.5 text-sm font-bold text-white">{children}</h3>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2.5 border-l-[3px] border-primary pl-2 text-sm font-bold text-primary">{children}</h4>;
}

function PolicyTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function PolicyContent() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionTitle>I. Thời gian bảo hành</SectionTitle>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left font-semibold text-muted-foreground">Hạng mục / Chất liệu</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Vali thường (ABS)</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Vali PP thường</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Vali PP trung &amp; cao cấp</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3">Bảo hành phụ kiện</td>
              <td className="border p-3">Trọn đời</td>
              <td className="border p-3">Trọn đời</td>
              <td className="border p-3">Trọn đời</td>
            </tr>
            <tr>
              <td className="border p-3">Đổi trả</td>
              <td className="border p-3">30 ngày đầu</td>
              <td className="border p-3">30 ngày đầu</td>
              <td className="border p-3">30 ngày đầu</td>
            </tr>
            <tr>
              <td className="border p-3">Bao bể (vỡ thân vali)</td>
              <td className="border p-3">30 ngày đầu</td>
              <td className="border p-3 font-semibold">4 năm</td>
              <td className="border p-3 font-semibold">10 năm</td>
            </tr>
          </tbody>
        </PolicyTable>
        <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm">
          <p className="mb-2 font-semibold">Lưu ý:</p>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li><strong className="text-foreground">Vali thường:</strong> phụ kiện cơ bản gồm tay kéo, bánh xe, quai xách, khóa số, vải lót ngăn lưới, dây ràng chữ Y.</li>
            <li><strong className="text-foreground">Vali trung cấp:</strong> như vali thường, bổ sung từ 3 tính năng trở lên (cổng USB, giá để ly, khóa kéo kép, khóa TSA...).</li>
            <li><strong className="text-foreground">Dòng nhựa PP:</strong> vỡ mặt được đổi sản phẩm mới. Các dòng nhựa khác vỡ mặt: thay mặt mới.</li>
            <li>
              <strong className="text-foreground">Chính sách bao bể — chính sách duy nhất trên thị trường:</strong>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                <li>Nhựa ABS, ABS+PC, PC bị vỡ trong 30 ngày đầu: thay mặt mới.</li>
                <li>Nhựa PP thường bị vỡ trong <strong className="text-foreground">4 năm</strong>, nhựa PP trung và cao cấp bị vỡ trong <strong className="text-foreground">10 năm</strong>: đổi mới 1 đổi 1.</li>
              </ul>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <SectionTitle>II. Điều kiện bảo hành</SectionTitle>

        <SubTitle>2.1. Điều kiện được bảo hành</SubTitle>
        <ul className="mb-5 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Sản phẩm do Vimove phân phối.</li>
          <li>Sản phẩm còn trong thời gian bảo hành.</li>
          <li>Sản phẩm lỗi do nhà sản xuất.</li>
        </ul>

        <SubTitle>2.2. Phạm vi bảo hành: tất cả phụ kiện</SubTitle>
        <ul className="mb-1.5 grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
          <li>Cần kéo</li>
          <li>Bánh xe</li>
          <li>Dây kéo và đầu khóa kéo của ngăn chính</li>
          <li>Tay cầm</li>
          <li>Khóa bấm của dây ràng bên trong vali</li>
          <li>Ổ khóa / khóa số</li>
          <li>Đường chỉ may</li>
        </ul>
        <p className="mb-5 text-xs text-muted-foreground italic">
          Với một số mã hàng ngừng sản xuất, không còn phụ kiện gốc: Vimove sẽ thay thế bằng phụ kiện tương đương (giống 70–99% so với phụ kiện ban đầu), vẫn đảm bảo chất lượng thay thế.
        </p>

        <SubTitle>2.3. Các trường hợp không nhận bảo hành hoặc bảo hành có tính phí</SubTitle>
        <ul className="mb-5 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Thân vali (sau 30 ngày nhận hàng – dòng ABS).</li>
          <li>Khóa khung, bản lề khung.</li>
          <li>Lớp vải lót và phần dây ràng (dây vải) bên trong vali.</li>
          <li>Dây kéo và đầu khóa kéo của các ngăn phụ, ngăn nới rộng và ngăn bên trong vali.</li>
          <li>Trường hợp cố tình phá hoại.</li>
          <li>Sản phẩm đã quá thời hạn bảo hành.</li>
          <li>Sản phẩm đã bị chỉnh sửa, thay đổi so với ban đầu mà không do Vimove thực hiện.</li>
          <li>Sản phẩm hư hỏng do tác động ngoại lực hoặc thiên tai: rạch đứt, móc rách, cháy, nổ…</li>
          <li>Sản phẩm chất liệu simili, ép nhiệt, giả da.</li>
        </ul>

        <SubTitle>2.4. Quy trình bảo hành</SubTitle>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="w-20 border p-3 text-center font-semibold text-muted-foreground">Bước</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Nội dung thực hiện</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3 text-center font-bold">1</td>
              <td className="border p-3">
                <strong>Tiếp nhận thông tin, hướng dẫn phương án bảo hành</strong>
                <br />
                a. Khách hàng gọi điện phản ánh vấn đề cần bảo hành.
                <br />
                b. Vimove hướng dẫn phương án bảo hành phù hợp:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li><strong>Phương án 1:</strong> Vimove hướng dẫn bảo hành online.</li>
                  <li><strong>Phương án 2:</strong> Vimove gửi phụ kiện kèm video/hình ảnh hướng dẫn bảo hành.</li>
                  <li><strong>Phương án 3:</strong> Khách hàng mang sản phẩm trực tiếp hoặc gửi chuyển phát đến văn phòng Vimove.</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td className="border p-3 text-center font-bold">2</td>
              <td className="border p-3">Vimove tiếp nhận sản phẩm và thực hiện bảo hành.</td>
            </tr>
            <tr>
              <td className="border p-3 text-center font-bold">3</td>
              <td className="border p-3">Sau khi bảo hành xong, Vimove liên hệ với khách hàng để hẹn thời gian và địa điểm trả sản phẩm.</td>
            </tr>
          </tbody>
        </PolicyTable>

        <SubTitle>2.5. Thời gian xử lý bảo hành</SubTitle>
        <ul className="mb-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li><strong className="text-foreground">Từ 5 – 20 ngày</strong>, tùy theo lỗi và dòng sản phẩm.</li>
          <li>Một số dòng sản phẩm phải nhập phụ kiện từ nước ngoài, thời gian xử lý có thể kéo dài, chậm nhất là 20 ngày.</li>
          <li>Trường hợp sản phẩm không có phụ kiện chính hãng tương đồng để sửa chữa/thay thế và thời gian xử lý quá 20 ngày kể từ ngày tiếp nhận, hệ thống Vimove sẽ hỗ trợ mức phí (*) để khách hàng đổi sang sản phẩm khác.</li>
        </ul>
        <p className="mb-5 text-xs text-muted-foreground italic">
          (*) Mức hỗ trợ phụ thuộc vào thời gian sử dụng sản phẩm, tính từ thời điểm mua hàng đến lúc Vimove tiếp nhận bảo hành.
          <br />
          <strong>Địa chỉ nhận bảo hành:</strong> 290 Nguyễn Trãi, Hà Đông, Hà Nội.
        </p>

        <SubTitle>2.6. Chi phí vận chuyển dịch vụ bảo hành</SubTitle>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="border p-3 text-left font-semibold text-muted-foreground">Trường hợp</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Bên chịu chi phí vận chuyển</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3">Lỗi do nhà sản xuất</td>
              <td className="border p-3">Vimove chịu phí vận chuyển 2 chiều</td>
            </tr>
            <tr>
              <td className="border p-3">Lỗi do người dùng / hết hạn bảo hành</td>
              <td className="border p-3">Khách hàng chịu phí vận chuyển</td>
            </tr>
          </tbody>
        </PolicyTable>

        <SubTitle>2.7. Biểu phí thay phụ kiện</SubTitle>
        <p className="mb-2 text-xs text-muted-foreground italic">Áp dụng khi sản phẩm quá hạn bảo hành hoặc lỗi không thuộc trách nhiệm nhà sản xuất.</p>
        <PolicyTable>
          <thead>
            <tr className="bg-muted">
              <th className="w-14 border p-3 text-center font-semibold text-muted-foreground">STT</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Hạng mục áp dụng</th>
              <th className="border p-3 text-left font-semibold text-muted-foreground">Mức phí</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3 text-center">1</td>
              <td className="border p-3">Bánh xe, quai xách, khóa số, ốc khóa, đế trống, tay kéo</td>
              <td className="border p-3">50.000 đồng / phụ kiện</td>
            </tr>
            <tr>
              <td className="border p-3 text-center">2</td>
              <td className="border p-3">Dây khóa kéo vali</td>
              <td className="border p-3">100.000 đồng / phụ kiện</td>
            </tr>
          </tbody>
        </PolicyTable>
      </section>
    </div>
  );
}
