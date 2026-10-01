// Bắn sự kiện "Lead" (Meta Pixel), "Contact" (TikTok Pixel) và "generate_lead" (GA4) —
// dùng ở MỌI CTA gọi điện/Zalo/"Liên hệ tư vấn" trên site công khai. Đây là điểm
// "chuyển đổi" thật của mô hình bán hàng Vimove: chốt đơn qua điện thoại/Zalo rồi sale
// nhập tay vào CRM, site KHÔNG có giỏ hàng/checkout online (xem floating-contact.tsx).
// Thiếu các sự kiện này thì Facebook/TikTok/Google không biết ai đã thực sự "chuyển
// đổi" sau khi bấm quảng cáo, nên không thể tối ưu phân phối/đo đúng chi phí trên mỗi
// lead. Module thuần (không "use client") — chỉ an toàn khi được import từ Client
// Component (những nơi có onClick), tự chặn bằng kiểm tra `typeof window`.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

export type LeadEventContext = {
  /** Tên sản phẩm đang xem (nếu CTA được bấm từ trang chi tiết sản phẩm). */
  contentName?: string;
  /** Slug/id ổn định của sản phẩm — dùng làm content_ids cho Meta/TikTok. */
  contentIds?: string[];
};

export function trackLeadEvent(context: LeadEventContext = {}) {
  if (typeof window === "undefined") return;
  const { contentName, contentIds } = context;

  try {
    window.fbq?.("track", "Lead", {
      content_name: contentName,
      content_ids: contentIds,
    });
  } catch {
    // Bỏ qua — không chặn CTA nếu Meta Pixel bị ad-blocker chặn hoặc chưa load kịp.
  }

  try {
    window.ttq?.track("Contact", {
      content_name: contentName,
      content_id: contentIds?.[0],
    });
  } catch {
    // Bỏ qua — không chặn CTA nếu TikTok Pixel bị chặn hoặc chưa load kịp.
  }

  try {
    window.gtag?.("event", "generate_lead", {
      content_name: contentName,
      content_ids: contentIds,
    });
  } catch {
    // Bỏ qua — không chặn CTA nếu GA4 chưa load kịp.
  }
}
