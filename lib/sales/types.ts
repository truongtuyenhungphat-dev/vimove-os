// Type union + nhãn hiển thị cho Sales (Phase 4).

export type SalesChannelType = "ONLINE" | "RETAIL" | "PARTNER" | "MARKETPLACE" | "OTHER";

export const SALES_CHANNEL_TYPES: SalesChannelType[] = ["ONLINE", "RETAIL", "PARTNER", "MARKETPLACE", "OTHER"];

export const SALES_CHANNEL_TYPE_LABELS: Record<SalesChannelType, string> = {
  ONLINE: "Online",
  RETAIL: "Cửa hàng",
  PARTNER: "Đối tác",
  MARKETPLACE: "Sàn TMĐT",
  OTHER: "Khác",
};

export type OrderStatus = "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED" | "REFUNDED";

export const ORDER_STATUSES: OrderStatus[] = ["DRAFT", "CONFIRMED", "FULFILLED", "CANCELLED", "REFUNDED"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Nháp",
  CONFIRMED: "Đã xác nhận",
  FULFILLED: "Đã giao",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
};
