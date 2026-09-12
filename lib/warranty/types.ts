// Type union + nhãn hiển thị cho Bảo hành (Phase 15 — di trú từ hệ thống Firebase cũ).

export type WarrantyStatus = "ACTIVE" | "CLAIMED" | "EXPIRED" | "VOIDED";

export const WARRANTY_STATUSES: WarrantyStatus[] = ["ACTIVE", "CLAIMED", "EXPIRED", "VOIDED"];

export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  ACTIVE: "Còn hạn",
  CLAIMED: "Đã bảo hành",
  EXPIRED: "Hết hạn",
  VOIDED: "Đã huỷ",
};
