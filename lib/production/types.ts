// Type union + nhãn hiển thị cho Sản xuất Content (Phase 17) — bảng đếm tiến độ
// hằng ngày + kanban riêng cho đội video ngắn, khác Content Hub (lib/marketing/types.ts).

export type ContentPieceStage = "IDEA" | "SCRIPT" | "SHOOT" | "EDIT" | "REVIEW" | "POSTED";

export const CONTENT_PIECE_STAGES: ContentPieceStage[] = ["IDEA", "SCRIPT", "SHOOT", "EDIT", "REVIEW", "POSTED"];

export const CONTENT_PIECE_STAGE_LABELS: Record<ContentPieceStage, string> = {
  IDEA: "Ý tưởng",
  SCRIPT: "Viết KB",
  SHOOT: "Quay",
  EDIT: "Edit",
  REVIEW: "Chờ duyệt",
  POSTED: "Đã đăng",
};

/** Task type đếm trong bảng tiến độ — trùng nhãn với các giai đoạn kanban tương ứng
 * (SCRIPT/SHOOT/EDIT/POSTED) để khi 1 thẻ chuyển sang giai đoạn đó, tự cộng dồn vào
 * đúng cột của bảng đếm hôm đó. IDEA/REVIEW không có task type tương ứng — không
 * tính vào bảng đếm. */
export const PRODUCTION_TASK_TYPES = ["Viết KB", "Quay", "Edit", "Post"] as const;
export type ProductionTaskType = (typeof PRODUCTION_TASK_TYPES)[number];

export const STAGE_TASK_TYPE: Partial<Record<ContentPieceStage, ProductionTaskType>> = {
  SCRIPT: "Viết KB",
  SHOOT: "Quay",
  EDIT: "Edit",
  POSTED: "Post",
};

export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function mondayOf(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = r.getDay();
  r.setDate(r.getDate() + (wd === 0 ? -6 : 1 - wd));
  return r;
}

export function parseDateKey(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function fmtShort(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
