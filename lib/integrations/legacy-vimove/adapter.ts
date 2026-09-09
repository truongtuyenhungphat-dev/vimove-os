import "server-only";

/**
 * LegacyVimoveAdapter (Phase 4) — theo đúng §1.3/§4 (Phase 4) của
 * docs/00-phuong-an-trien-khai.md: "Bắt đầu thiết kế LegacyVimoveAdapter interface
 * (đọc customer/order cũ nếu cần đối chiếu — chỉ interface + stub, chưa nối thật trừ
 * khi có yêu cầu di trú dữ liệu cụ thể)".
 *
 * VimoveCRM (hệ thống nội bộ hiện có, đang chạy production trên Railway/Vercel/
 * Supabase) là "Legacy VIMOVE" — VIMOVE OS build mới hoàn toàn, KHÔNG bao giờ trỏ
 * thẳng Prisma của VIMOVE OS vào database của VimoveCRM. Mọi truy cập dữ liệu cũ (nếu
 * cần đối chiếu khi di trú) phải đi qua adapter này, giống quy tắc §3 rule 10 ("Mọi
 * tích hợp bên ngoài đi qua adapter, không gọi thẳng SDK provider trong route
 * handler").
 *
 * Hiện tại CHƯA có yêu cầu di trú dữ liệu cụ thể nào, nên chỉ định nghĩa interface +
 * một stub trả về rỗng (NullLegacyVimoveAdapter) — không kết nối DB/API thật của
 * VimoveCRM. Khi có yêu cầu thật, viết thêm 1 class implement interface này (vd.
 * `SupabaseLegacyVimoveAdapter` gọi Supabase REST/Postgres của VimoveCRM qua
 * connection string riêng, KHÔNG qua Prisma Client của VIMOVE OS) và đổi
 * `getLegacyVimoveAdapter()` để trả về class đó.
 */

export type LegacyCustomerRecord = {
  legacyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  createdAt: Date;
};

export type LegacyOrderRecord = {
  legacyId: string;
  legacyCustomerId: string;
  totalAmount: number;
  status: string;
  orderDate: Date;
};

export interface LegacyVimoveAdapter {
  /** Đối chiếu khách hàng cũ theo email (vd. khi tạo Customer mới, cảnh báo trùng). */
  findCustomerByEmail(email: string): Promise<LegacyCustomerRecord | null>;
  /** Lấy đơn hàng cũ của 1 khách hàng (theo legacyCustomerId) để đối chiếu lịch sử. */
  listOrdersByCustomer(legacyCustomerId: string): Promise<LegacyOrderRecord[]>;
  /** Health check — dùng để hiện trạng thái kết nối ở trang tích hợp (nếu có UI sau này). */
  isConfigured(): boolean;
}

/**
 * Stub mặc định: luôn trả rỗng / isConfigured() = false. Không gọi mạng, không đọc
 * env, an toàn để dùng làm default khi chưa có yêu cầu di trú dữ liệu cụ thể.
 */
export class NullLegacyVimoveAdapter implements LegacyVimoveAdapter {
  async findCustomerByEmail(): Promise<LegacyCustomerRecord | null> {
    return null;
  }

  async listOrdersByCustomer(): Promise<LegacyOrderRecord[]> {
    return [];
  }

  isConfigured(): boolean {
    return false;
  }
}

let cachedAdapter: LegacyVimoveAdapter | null = null;

export function getLegacyVimoveAdapter(): LegacyVimoveAdapter {
  if (!cachedAdapter) cachedAdapter = new NullLegacyVimoveAdapter();
  return cachedAdapter;
}
