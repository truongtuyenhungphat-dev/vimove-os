// Union types + nhãn tiếng Việt cho Project & Process (Phase 3) — dùng chung server &
// client, cùng quy ước với lib/work/types.ts.

export const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Lên kế hoạch",
  ACTIVE: "Đang chạy",
  ON_HOLD: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const PROJECT_MEMBER_ROLES = ["OWNER", "MEMBER", "VIEWER"] as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

export const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  OWNER: "Chủ dự án",
  MEMBER: "Thành viên",
  VIEWER: "Chỉ xem",
};

export type MilestoneStatus = "PENDING" | "DONE";

export const WORKFLOW_NODE_TYPES = [
  "TRIGGER",
  "ACTION",
  "CONDITION",
  "APPROVAL",
  "DELAY",
  "PARALLEL",
  "WEBHOOK",
  "AI",
] as const;
export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];

export const WORKFLOW_NODE_LABELS: Record<WorkflowNodeType, string> = {
  TRIGGER: "Trigger",
  ACTION: "Action",
  CONDITION: "Condition",
  APPROVAL: "Approval",
  DELAY: "Delay",
  PARALLEL: "Parallel",
  WEBHOOK: "Webhook",
  AI: "AI",
};

export type WorkflowRunStatus = "PENDING" | "RUNNING" | "AWAITING_APPROVAL" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type WorkflowStepStatus = "PENDING" | "RUNNING" | "AWAITING_APPROVAL" | "SUCCEEDED" | "FAILED" | "SKIPPED";

export const WORKFLOW_RUN_STATUS_LABELS: Record<WorkflowRunStatus, string> = {
  PENDING: "Chờ chạy",
  RUNNING: "Đang chạy",
  AWAITING_APPROVAL: "Chờ duyệt",
  SUCCEEDED: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã huỷ",
};

export const ApprovalEntityTypeList = ["TASK", "CONTENT", "CREATIVE", "CAMPAIGN", "BUDGET", "PURCHASE", "LEAVE"] as const;
export type ApprovalEntityType = (typeof ApprovalEntityTypeList)[number];

export const APPROVAL_ENTITY_LABELS: Record<ApprovalEntityType, string> = {
  TASK: "Công việc",
  CONTENT: "Nội dung",
  CREATIVE: "Creative",
  CAMPAIGN: "Chiến dịch",
  BUDGET: "Ngân sách",
  PURCHASE: "Mua sắm",
  LEAVE: "Đơn nghỉ phép", // Phase 11 — Chấm công
};

export type ApprovalMode = "SEQUENTIAL" | "PARALLEL";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalStepStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã huỷ",
};

// ---------------------------------------------------------------------------
// Workflow definition (Json lưu trong WorkflowVersion.definition) — dạng React Flow
// nodes/edges, mỗi node mang `data.config` riêng theo nodeType.
// ---------------------------------------------------------------------------

export type ActionConfig =
  | { actionKind: "notify"; userId: string; message: string }
  | { actionKind: "audit_log"; message: string };

export type ConditionConfig = {
  field: string; // dot-path trong context, vd "trigger.priority"
  operator: "eq" | "neq" | "contains" | "gt" | "lt";
  value: string;
};

export type DelayConfig = { minutes: number };

export type WebhookConfig = { url: string; method: "GET" | "POST"; retries?: number };

export type ApprovalNodeConfig = { approverIds: string[]; mode: ApprovalMode };

export type AiConfig = { prompt: string };

export type WorkflowNodeConfig =
  | ActionConfig
  | ConditionConfig
  | DelayConfig
  | WebhookConfig
  | ApprovalNodeConfig
  | AiConfig
  | Record<string, never>;

export type WorkflowFlowNode = {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: { label: string; config: WorkflowNodeConfig };
};

export type WorkflowFlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null; // "true" | "false" cho nhánh của CONDITION
};

export type WorkflowDefinition = { nodes: WorkflowFlowNode[]; edges: WorkflowFlowEdge[] };

export const EMPTY_WORKFLOW_DEFINITION: WorkflowDefinition = {
  nodes: [
    {
      id: "trigger-1",
      type: "TRIGGER",
      position: { x: 0, y: 0 },
      data: { label: "Chạy thủ công", config: {} },
    },
  ],
  edges: [],
};

/** Danh sách event type thật sự được ghi qua `writeEvent()` (Phase 7) và có thể
 * dùng làm trigger tự động cho Automation Engine (Phase 9) — xem
 * services/process/automation.ts. Thêm domain mới chỉ cần domain đó gọi
 * `writeEvent()` với type mới rồi thêm 1 dòng vào đây, không cần sửa automation
 * engine. */
export const AUTOMATION_EVENT_TYPES = ["task.created", "lead.created", "lead.won", "order.created", "campaign.created"] as const;
export type AutomationEventType = (typeof AUTOMATION_EVENT_TYPES)[number];
export const AUTOMATION_EVENT_TYPE_LABELS: Record<AutomationEventType, string> = {
  "task.created": "Công việc mới được tạo (Work)",
  "lead.created": "Lead mới được tạo (CRM)",
  "lead.won": "Lead chuyển sang Thắng (CRM)",
  "order.created": "Đơn hàng mới được tạo (Sales)",
  "campaign.created": "Chiến dịch mới được tạo (Marketing)",
};
