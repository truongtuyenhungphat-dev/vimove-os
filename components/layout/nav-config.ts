import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Building2,
  UsersRound,
  ShieldCheck,
  KeyRound,
  ScrollText,
  Settings,
  ClipboardList,
  ListTodo,
  Kanban,
  CalendarDays,
  GanttChartSquare,
  Gauge,
  LayoutTemplate,
  FolderKanban,
  Workflow,
  Users2,
  GitBranch,
  ShoppingCart,
  Package,
  Store,
  Megaphone,
  FileEdit,
  Share2,
  FileText,
  Mail,
  Plug,
  LineChart,
  ScanSearch,
  BarChart3,
  Bot,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";
import type { PermissionKey } from "@/lib/permissions/catalog";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * Sidebar: Dashboard (Phase 1) + Work (Phase 2) + Project & Process (Phase 3) + CRM/
 * Sales (Phase 4) + Marketing (Phase 5) + Ads Integration (Phase 6 — code xong,
 * chưa verify sandbox thật vì chưa có app credential, xem docs/06-ads-integration.md)
 * + Analytics (Phase 7) + AI Command Center (Phase 8 — code xong, chưa verify API
 * Claude thật vì chưa có ANTHROPIC_API_KEY, xem docs/08-ai-command-center.md; luồng
 * Insight→Recommendation→Approval→Action verify được vì không phụ thuộc API key).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Tổng quan",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Work",
    items: [
      { label: "Việc của tôi", href: "/work/my-tasks", icon: ClipboardList, permission: "tasks.read" },
      { label: "Tất cả công việc", href: "/work/tasks", icon: ListTodo, permission: "tasks.read" },
      { label: "Kanban", href: "/work/kanban", icon: Kanban, permission: "tasks.read" },
      { label: "Lịch", href: "/work/calendar", icon: CalendarDays, permission: "tasks.read" },
      { label: "Timeline", href: "/work/timeline", icon: GanttChartSquare, permission: "tasks.read" },
      { label: "Gantt", href: "/work/gantt", icon: GanttChartSquare, permission: "tasks.read" },
      { label: "Khối lượng công việc", href: "/work/workload", icon: Gauge, permission: "tasks.read" },
      { label: "Mẫu công việc", href: "/work/templates", icon: LayoutTemplate, permission: "task_templates.manage" },
      { label: "Approval Hub", href: "/work/approvals", icon: ShieldCheck, permission: "approvals.read" },
    ],
  },
  {
    title: "Project & Process",
    items: [
      { label: "Dự án", href: "/projects", icon: FolderKanban, permission: "projects.read" },
      { label: "Workflow Builder", href: "/process/workflows", icon: Workflow, permission: "workflows.read" },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Lead", href: "/crm/leads", icon: Users2, permission: "leads.read" },
      { label: "Khách hàng", href: "/crm/customers", icon: Building2, permission: "customers.read" },
      { label: "Pipeline", href: "/crm/pipelines", icon: GitBranch, permission: "sales_catalog.manage" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Đơn hàng", href: "/sales/orders", icon: ShoppingCart, permission: "orders.read" },
      { label: "Sản phẩm", href: "/sales/products", icon: Package, permission: "sales_catalog.manage" },
      { label: "Kênh bán", href: "/sales/channels", icon: Store, permission: "sales_catalog.manage" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Chiến dịch", href: "/marketing/campaigns", icon: Megaphone, permission: "campaigns.read" },
      { label: "Content Hub", href: "/marketing/content", icon: FileEdit, permission: "content.read" },
      { label: "Social", href: "/marketing/social", icon: Share2, permission: "marketing_channels.read" },
      { label: "Landing Page", href: "/marketing/landing-pages", icon: FileText, permission: "marketing_channels.read" },
      { label: "Email Campaign", href: "/marketing/email", icon: Mail, permission: "marketing_channels.read" },
    ],
  },
  {
    title: "Tích hợp",
    items: [{ label: "Quảng cáo", href: "/integrations/ads", icon: Plug, permission: "ads.read" }],
  },
  {
    title: "Analytics",
    items: [
      { label: "Dashboard", href: "/analytics", icon: LineChart, permission: "analytics.read" },
      { label: "Report Builder", href: "/analytics/reports", icon: BarChart3, permission: "analytics.read" },
      { label: "Data Quality Hub", href: "/analytics/data-quality", icon: ScanSearch, permission: "analytics.read" },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "Trợ lý AI", href: "/ai/assistant", icon: Bot, permission: "ai.read" },
      { label: "AI Insights", href: "/ai/insights", icon: Lightbulb, permission: "ai.read" },
      { label: "Approval Queue", href: "/ai/recommendations", icon: ShieldCheck, permission: "ai.read" },
    ],
  },
  {
    title: "Quản trị",
    items: [
      { label: "Người dùng", href: "/admin/users", icon: Users, permission: "users.read" },
      { label: "Phòng ban", href: "/admin/departments", icon: Building2, permission: "departments.read" },
      { label: "Nhóm", href: "/admin/teams", icon: UsersRound, permission: "teams.read" },
      { label: "Vai trò", href: "/admin/roles", icon: ShieldCheck, permission: "roles.read" },
      { label: "Quyền hạn", href: "/admin/permissions", icon: KeyRound, permission: "roles.read" },
      { label: "Nhật ký Audit", href: "/admin/audit-logs", icon: ScrollText, permission: "audit_logs.read" },
      { label: "Observability", href: "/admin/observability", icon: ShieldAlert, permission: "observability.read" },
      { label: "Cài đặt tổ chức", href: "/admin/settings", icon: Settings, permission: "organization.manage" },
    ],
  },
];
