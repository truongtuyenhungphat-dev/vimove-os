"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Quản trị",
  users: "Người dùng",
  departments: "Phòng ban",
  teams: "Nhóm",
  roles: "Vai trò",
  permissions: "Quyền hạn",
  "audit-logs": "Nhật ký Audit",
  settings: "Cài đặt tổ chức",
  profile: "Hồ sơ cá nhân",
  notifications: "Thông báo",
  new: "Tạo mới",
  work: "Work",
  "my-tasks": "Việc của tôi",
  tasks: "Tất cả công việc",
  kanban: "Kanban",
  calendar: "Lịch",
  timeline: "Timeline",
  gantt: "Gantt",
  workload: "Khối lượng công việc",
  templates: "Mẫu công việc",
  approvals: "Approval Hub",
  projects: "Dự án",
  process: "Process",
  workflows: "Workflow Builder",
  runs: "Run log",
  crm: "CRM",
  leads: "Lead",
  customers: "Khách hàng",
  pipelines: "Pipeline",
  sales: "Sales",
  orders: "Đơn hàng",
  products: "Sản phẩm",
  channels: "Kênh bán",
  marketing: "Marketing",
  campaigns: "Chiến dịch",
  content: "Content Hub",
  social: "Social",
  "landing-pages": "Landing Page",
  email: "Email Campaign",
  integrations: "Tích hợp",
  ads: "Quảng cáo",
  analytics: "Analytics",
  reports: "Report Builder",
  "data-quality": "Data Quality Hub",
  ai: "AI",
  assistant: "Trợ lý AI",
  insights: "AI Insights",
  recommendations: "Approval Queue",
  observability: "Observability",
  attendance: "Chấm công",
  checkin: "Chấm công",
  timesheet: "Bảng công",
  leave: "Đơn nghỉ phép",
  shifts: "Xếp ca",
  locations: "Địa điểm chấm công",
  qr: "Quét QR",
};

function labelFor(segment: string) {
  return SEGMENT_LABELS[segment] ?? "Chi tiết";
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: labelFor(segment),
    isLast: index === segments.length - 1,
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
