// Type union + nhãn hiển thị cho Bảo hành (Phase 15 — di trú từ hệ thống Firebase cũ).

export type WarrantyStatus = "ACTIVE" | "CLAIMED" | "EXPIRED" | "VOIDED";

export const WARRANTY_STATUSES: WarrantyStatus[] = ["ACTIVE", "CLAIMED", "EXPIRED", "VOIDED"];

export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  ACTIVE: "Còn hạn",
  CLAIMED: "Đã bảo hành",
  EXPIRED: "Hết hạn",
  VOIDED: "Đã huỷ",
};

// 63 tỉnh/thành — dùng cho form đăng ký bảo hành công khai (app/(public)/bao-hanh),
// port nguyên văn từ cổng bảo hành Firebase cũ (chinh-sach-bao-hanh/index.html).
export const VIETNAM_PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "An Giang",
  "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre",
  "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai",
  "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình",
  "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình",
  "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh",
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

export const WARRANTY_PURCHASE_CHANNELS = [
  "Website Vimove.com.vn", "Shopee", "Lazada", "TikTok Shop",
  "Mua trực tiếp tại cửa hàng", "Đại lý phân phối", "Khác",
];

export const WARRANTY_COLORS = [
  "Tím", "Tím Pastel", "Đen", "Xanh Navy", "Hồng Pastel", "Xanh Lily",
  "Xám Titan / Xám Rêu", "Cam Đào", "Đỏ Đô", "Trắng",
];

export const WARRANTY_SIZES = [
  "20 inch (Size S - Cabin)", "24 inch (Size M - Ký gửi)",
  "28 inch (Size L - Khung lớn)", "Freesize (Phụ kiện / Túi)",
];
