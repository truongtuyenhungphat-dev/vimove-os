import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // "/bao-hanh" là tên route ban đầu của cổng bảo hành công khai (Phase 16),
  // đổi lại thành "/chinh-sach-bao-hanh" cho khớp đúng path đã in sẵn trên vật
  // liệu marketing/QR code sản phẩm ngoài đời thật (site cũ dùng path này) —
  // giữ redirect 308 phòng trường hợp link "/bao-hanh" đã bị lưu/index đâu đó
  // trong thời gian ngắn nó từng là route thật.
  async redirects() {
    return [{ source: "/bao-hanh", destination: "/chinh-sach-bao-hanh", permanent: true }];
  },
};

export default nextConfig;
