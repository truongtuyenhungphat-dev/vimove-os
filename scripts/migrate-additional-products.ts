/**
 * Bổ sung 6 sản phẩm THẬT còn thiếu so với site cũ (phát hiện khi rà soát
 * lại thiết kế/nội dung website công khai — Phase 16, đợt 2). Đây là các
 * trang chi tiết sản phẩm CÓ THẬT trong site Firebase cũ
 * (`~/Desktop/vimove-web-baohanh-export/san-pham/*.html`) nhưng CHƯA từng
 * có trong Firestore `products` collection nên không nằm trong đợt di trú
 * đầu (scripts/migrate-product-catalog.ts, legacy-products.json) — phải
 * chép tay từ HTML gốc (giá/màu/size/mô tả lấy nguyên văn, không bịa).
 *
 * Ảnh đã có sẵn trong public/products/ (copy cùng đợt với 6 sản phẩm đầu).
 *
 * Đối chiếu theo slug — an toàn chạy lại (update thay vì tạo trùng), giống
 * hệt cách migrate-product-catalog.ts đã làm.
 *
 * Chạy: npx tsx scripts/migrate-additional-products.ts
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PRODUCTS = [
  {
    slug: "vali-keo-travelking-8809",
    name: "Vali Kéo Travelking 8809",
    price: 1350000,
    oldPrice: null,
    category: "vali",
    material: "Nhựa PP",
    sizes: ["20 inch (Cabin)", "25 inch (Ký gửi)", "29 inch (Đại)"],
    colors: ["Ghi xám", "Xanh nhạt", "Hồng tím", "Ghi xanh", "Ghi đậm", "Đen"],
    description:
      "Vali nhựa PP Travelking 8809 là siêu phẩm đồng hành hoàn hảo dành cho những tín đồ xê dịch và người thường xuyên đi công tác. Chất liệu nhựa PP siêu dẻo dai, chống bể vỡ vô địch bất chấp va đập mạnh tại ký gửi sân bay.\n\n" +
      "Điểm nổi bật:\n" +
      "- Nhựa PP cao cấp: siêu dẻo dai, tự phục hồi form dáng sau khi chịu lực ép, hạn chế nứt vỡ\n" +
      "- Tay kéo hợp kim nhôm: chống gỉ siêu nhẹ, dễ điều chỉnh chiều cao\n" +
      "- Khóa số TSA bảo mật: đạt chuẩn an ninh hàng không quốc tế\n" +
      "- Dây khóa kép chống rạch: ngăn chặn hành vi xâm nhập bằng vật nhọn\n" +
      "- Móc treo đồ tích hợp: rảnh tay treo túi mua sắm, làm chân đế khi đặt nằm ngang\n" +
      "- Nội thất thông minh: đai chữ Y, vách lưới, ngăn chống thấm đựng đồ ướt\n\n" +
      "Chính sách bảo hành: phụ kiện trọn đời (cần kéo, bánh xe, khóa số), vỡ mặt nhựa 4 năm. Đổi trả tự do 30 ngày với bất kỳ lý do gì.",
    images: [1, 2, 3, 4, 5].map((i) => `/products/travelking-8809-${i}.jpg`),
  },
  {
    slug: "vali-keo-travelking-1806",
    name: "Vali Kéo Travelking 1806",
    price: 2150000,
    oldPrice: null,
    category: "vali",
    material: "Nhựa PP",
    sizes: ["20 inch (Cabin, ngăn laptop)", "24 inch (Ký gửi, mở rộng)", "28 inch (Đại, mở rộng)"],
    colors: ["Cam vũ trụ", "Ghi đậm"],
    description:
      "Vali nhựa PP Travelking 1806 – siêu phẩm vali du lịch thế hệ mới thách thức mọi va đập. Sở hữu chất liệu nhựa PP siêu đàn hồi chống bể vỡ tuyệt đối, kết hợp ngăn chứa laptop mặt trước thông minh và khóa số TSA bảo mật chuẩn quốc tế.\n\n" +
      "Điểm nổi bật:\n" +
      "- Nhựa PP nguyên sinh: siêu đàn hồi, chịu lực cực tốt, chống bể vỡ tuyệt đối\n" +
      "- Khóa số TSA: đạt tiêu chuẩn Cục An ninh Vận tải Hoa Kỳ\n" +
      "- Bánh xe kép xoay 360°: bọc cao su non, vận hành êm ái, giảm ồn\n" +
      "- Ngăn laptop riêng biệt (size 20): cất/lấy máy nhanh qua cửa an ninh sân bay\n" +
      "- Mở rộng sức chứa (size 24 & 28): dây khóa nới rộng tăng thêm 25% thể tích\n" +
      "- Tặng kèm áo trùm vali theo từng size\n\n" +
      "Chính sách bảo hành: phụ kiện trọn đời (tay kéo, bánh xe, khóa số), nhựa PP vỡ là đổi từ 2-4 năm. Đổi trả tự do 30 ngày với bất kỳ lý do gì.",
    images: [1, 2, 3, 4, 5].map((i) => `/products/travelking-1806-${i}.jpg`),
  },
  {
    slug: "vali-keo-vybe-waveup-vb-68",
    name: "Vali Kéo Vybe Waveup VB-68",
    price: 599000,
    oldPrice: 900000,
    category: "vali",
    material: "Nhựa ABS",
    sizes: ["20 inch (Cabin)", "24 inch (Ký gửi)"],
    colors: ["Xanh lily", "Xanh nhạt", "Đen", "Xám rêu", "Cam đào", "Tím"],
    description:
      "Vali kéo nhựa ABS Vybe Waveup VB-68 sở hữu thiết kế đột phá dành riêng cho giới trẻ hiện đại, dân công sở và sinh viên năng động. Chất liệu nhựa ABS cứng cáp chống trầy, kết hợp cùng khay đựng cốc tiện lợi và khóa chống rạch bảo mật tối đa.\n\n" +
      "Điểm nổi bật:\n" +
      "- Nhựa ABS cứng cáp, chống trầy: bề mặt vân nhám hạn chế xước khi va đập\n" +
      "- Khay đựng cốc/bình nước: để ly trà sữa, cafe tiện lợi khi chờ sân bay, ga tàu\n" +
      "- Khóa kép chống rạch: bảo vệ tài sản an toàn nơi đông người\n" +
      "- Khóa số 3 số âm chìm: thẩm mỹ hiện đại, hạn chế va quẹt gây nứt vỡ khóa\n" +
      "- Bánh xe kép xoay 360°: bọc cao su giảm chấn, di chuyển êm ái\n" +
      "- Bảng màu thời thượng: từ pastel nhẹ nhàng đến neon cá tính\n\n" +
      "Chính sách bảo hành: phụ kiện trọn đời (tay kéo, bánh xe, khóa số). Đổi trả tự do 30 ngày với bất kỳ lý do gì.",
    images: [1, 2, 3, 4, 5].map((i) => `/products/vybe-waveup-vb68-${i}.jpg`),
  },
  {
    slug: "tui-trum-vali-trong-suot-vybe",
    name: "Túi Trùm Vali Trong Suốt Vybe",
    price: 49000,
    oldPrice: 79000,
    category: "phu-kien",
    material: "Nhựa trong suốt",
    sizes: ["20 inch", "24 inch", "28 inch"],
    colors: [],
    description:
      "Vali rất dễ bị trầy, bám bụi, dính nước hoặc va quẹt trong quá trình di chuyển, ký gửi, đi mưa hay cất giữ. Túi trùm vali trong suốt Vybe giúp bảo vệ vali tốt hơn mà vẫn giữ được màu sắc, kiểu dáng và logo vali bên trong.\n\n" +
      "Điểm nổi bật:\n" +
      "- Bảo vệ vali khi di chuyển: hạn chế trầy xước, bụi bẩn và va quẹt khi ký gửi\n" +
      "- Chất liệu trong suốt: vẫn nhìn rõ màu vali, logo, tránh nhầm lẫn khi lấy hành lý\n" +
      "- Hạn chế bụi bẩn, ẩm ướt: phù hợp đi mưa nhẹ hoặc bảo quản vali lâu ngày\n" +
      "- Thiết kế ôm vali: có phần mở phù hợp để kéo tay cầm và di chuyển bánh xe\n" +
      "- Gọn nhẹ, dễ cất giữ: gấp gọn khi không dùng, không chiếm diện tích\n\n" +
      "Bảng size tham khảo (chiều cao vali không tính bánh xe): 20 inch: 55–57cm · 24 inch: 63–65cm · 28 inch: 73–75cm. Vui lòng đo kích thước vali thực tế trước khi chọn size.",
    images: [1, 2, 3, 4, 5].map((i) => `/products/vybe-tui-trum-vali-${i}.jpg`),
  },
  {
    slug: "tui-dung-giay-du-lich-vybe",
    name: "Túi Đựng Giày Du Lịch Vybe",
    price: 39600,
    oldPrice: 60000,
    category: "phu-kien",
    material: "Vải",
    sizes: [],
    colors: ["Đen"],
    description:
      "Khi đi du lịch, công tác hoặc tập gym, giày dép rất dễ làm bẩn quần áo và đồ dùng trong vali. Túi đựng giày du lịch Vybe giúp bạn tách riêng giày dép, giữ hành lý gọn gàng, sạch sẽ và dễ mang theo hơn trong mọi chuyến đi.\n\n" +
      "Điểm nổi bật:\n" +
      "- Tách riêng giày dép: hạn chế bụi bẩn, mùi bám vào đồ dùng khác trong vali\n" +
      "- Gọn nhẹ, dễ mang theo: form mỏng, không chiếm nhiều diện tích\n" +
      "- Quai xách tiện lợi: dễ cầm tay, treo lên vali hoặc móc treo\n" +
      "- Ứng dụng linh hoạt: ngoài giày dép còn dùng đựng dép tắm, đồ tập, phụ kiện nhỏ\n\n" +
      "Mua 2 giảm 40%.",
    images: [1, 2, 3, 4, 5].map((i) => `/products/vybe-tui-giay-${i}.jpg`),
  },
  {
    slug: "set-3-tui-dung-do-ripstop-vybe",
    name: "Set 3 Túi Đựng Đồ Ripstop Vybe",
    price: 285000,
    oldPrice: null,
    category: "phu-kien",
    material: "Vải Ripstop",
    sizes: ['Set 3 túi (S 9" / M 12" / L 14")'],
    colors: ["Hồng phấn"],
    description:
      "Bạn thường xuyên mất thời gian lục tung vali để tìm một món đồ nhỏ? Set 3 túi đựng đồ du lịch Ripstop chính là giải pháp dọn dẹp vali thông minh dành cho bạn! Với bộ 3 kích cỡ tiện dụng, sản phẩm giúp bạn phân loại hành lý một cách khoa học, gọn gàng và tiết kiệm đến 50% diện tích vali.\n\n" +
      "Điểm nổi bật:\n" +
      "- Vải Ripstop siêu nhẹ, chống rách vượt trội: kỹ thuật dệt ô vuông đan xen giúp cấu trúc siêu bền\n" +
      "- Mặt lưới thoáng khí, dễ quan sát: quần áo khô ráo, dễ nhìn đồ bên trong mà không cần mở khóa kéo\n" +
      "- Quai xách tiện lợi: dễ dàng xách tay riêng hoặc treo móc trong tủ đồ khách sạn\n" +
      "- Khóa kéo mượt mà: đường may bo viền tinh tế, thao tác đóng mở nhanh chóng\n\n" +
      "Kích thước từng size: Size S (9\"): 21 × 17.5 × 9.5cm — đồ lót, tất vớ, sạc cáp, mỹ phẩm. Size M (12\"): 28 × 19 × 9.5cm — áo thun, quần đùi, đồ mặc nhà. Size L (14\"): 36 × 21 × 9.5cm — quần tây, quần jean, váy đầm, áo khoác.\n\n" +
      "Lưu ý: sản phẩm đang tạm hết hàng tại thời điểm di trú dữ liệu — gọi hotline 0988 512 352 để đặt trước và được thông báo ngay khi có hàng trở lại.",
    images: [1, 2, 3, 4].map((i) => `/products/vybe-set3-tui-${i}.jpg`),
  },
];

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) throw new Error("Không tìm thấy organization 'vimove'.");

  let created = 0;
  let updated = 0;
  for (const p of PRODUCTS) {
    const { slug, ...data } = p;
    const fullData = { ...data, isPublished: true, isActive: true };
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({ where: { slug }, data: fullData });
      updated++;
    } else {
      await prisma.product.create({ data: { organizationId: organization.id, slug, ...fullData } });
      created++;
    }
  }

  console.log(`Sản phẩm bổ sung: ${created} tạo mới, ${updated} cập nhật (đối chiếu theo slug — an toàn chạy lại).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
