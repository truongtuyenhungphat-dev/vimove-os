import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Users,
  Building2,
  UsersRound,
  ClipboardCheck,
  ListTodo,
  UserPlus,
  Target,
  ShoppingCart,
  Wallet,
  Megaphone,
  BadgeCheck,
  ShieldAlert,
  Fingerprint,
  Sparkles,
  Workflow,
  FileText,
  ArrowRight,
  History,
} from "lucide-react";
import { requireSession, hasPermission } from "@/lib/auth/rbac";
import { getOrganization } from "@/services/core/organization";
import { getDashboardOverview } from "@/services/core/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { DonutChart, type DonutSegment } from "@/components/shared/donut-chart";
import { DueTabsWidget } from "@/components/dashboard/due-tabs-widget";
import { TaskStatusBadge } from "@/components/work/task-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard — VIMOVE OS" };

function formatCurrency(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-muted-foreground">{children}</h2>;
}

function ReminderMiniCard({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg leading-tight font-semibold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const session = await requireSession();
  const { denied } = await searchParams;
  const [overview, organization] = await Promise.all([
    getDashboardOverview(session.user.organizationId, session.user.id),
    getOrganization(session.user.organizationId),
  ]);

  const canSeeWork = hasPermission(session, "tasks.read");
  const canSeeCrm = hasPermission(session, "leads.read");
  const canSeeSales = hasPermission(session, "orders.read");
  const canSeeMarketing = hasPermission(session, "campaigns.read");
  const canSeeWarranty = hasPermission(session, "warranty.read");
  const canSeeAttendance = hasPermission(session, "attendance.read");
  const canSeeWorkflows = hasPermission(session, "workflows.read");
  const canSeeAi = hasPermission(session, "ai.read");

  const statusSegments: DonutSegment[] = [
    { label: "Cần làm", value: overview.myTaskStatusCounts.TODO, colorVar: "var(--muted-foreground)" },
    { label: "Đang làm", value: overview.myTaskStatusCounts.IN_PROGRESS, colorVar: "var(--primary)" },
    { label: "Chờ duyệt", value: overview.myTaskStatusCounts.IN_REVIEW, colorVar: "oklch(0.75 0.15 80)" },
    { label: "Hoàn thành", value: overview.myTaskStatusCounts.DONE, colorVar: "oklch(0.7 0.15 160)" },
    { label: "Đã huỷ", value: overview.myTaskStatusCounts.CANCELLED, colorVar: "var(--destructive)" },
  ];

  const reminders = [
    canSeeWork && { icon: ListTodo, label: "Việc đến hạn hôm nay", value: overview.work.dueToday, href: "/work/my-tasks" },
    { icon: ClipboardCheck, label: "Chờ bạn phê duyệt", value: overview.approvals.pending, href: "/work/approvals" },
    canSeeWorkflows && { icon: Workflow, label: "Quy trình đang chạy", value: overview.process.activeRuns, href: "/process/runs" },
    canSeeAttendance && { icon: FileText, label: "Đơn từ chờ duyệt", value: overview.leave.pending, href: "/attendance/leave" },
  ].filter((r): r is { icon: LucideIcon; label: string; value: number; href: string } => !!r);

  return (
    <>
      {denied && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>Không có quyền truy cập</AlertTitle>
          <AlertDescription>
            Bạn không có quyền &quot;{denied}&quot; để mở trang vừa yêu cầu.
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        title={`Chào mừng trở lại, ${session.user.name?.split(" ").pop() ?? ""}`}
        description={`${organization.name} — tổng quan toàn hệ thống`}
      />

      {/* "Nhắc việc hôm nay" — card viền gradient, dải mini-card thật (tham
       * khảo bố cục Tổng quan MISA AMIS Công việc, giữ màu thương hiệu
       * VIMOVE OS thay vì màu MISA — xem .gradient-border-card ở globals.css). */}
      {reminders.length > 0 && (
        <div className="gradient-border-card">
          <div className="rounded-[calc(var(--radius-xl)-1px)] bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Nhắc việc hôm nay
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {reminders.map((r) => (
                <ReminderMiniCard key={r.label} {...r} />
              ))}
            </div>
          </div>
        </div>
      )}

      {canSeeWork && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Việc của tôi</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart segments={statusSegments} centerLabel="công việc" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách công việc cần làm</CardTitle>
            </CardHeader>
            <CardContent>
              <DueTabsWidget
                overdue={overview.myTaskDueLists.overdue}
                dueToday={overview.myTaskDueLists.dueToday}
                upcoming={overview.myTaskDueLists.upcoming}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Thay cho "Công việc được ghim" của MISA (Task ở đây chưa có field
       * pin) — "cập nhật gần đây" toàn tổ chức, dữ liệu thật. */}
      {canSeeWork && overview.recentlyUpdatedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-muted-foreground" aria-hidden="true" />
              Cập nhật gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {overview.recentlyUpdatedTasks.map((t) => (
              <Link
                key={t.id}
                href={`/work/tasks/${t.id}`}
                className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm hover:text-primary"
              >
                <span className="truncate">{t.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {t.assignee?.name ?? "Chưa gán"}
                  <TaskStatusBadge status={t.status} />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* "AI gợi ý hành động" — chỉ hiện khi có đề xuất THẬT đang chờ (không
       * bịa nội dung như MISA AVA — hệ thống AI recommendations đã có thật
       * ở Phase 8/9, chỉ hiện khi thực sự có dữ liệu). */}
      {canSeeAi && overview.ai.recommendationsPending > 0 && (
        <div className="gradient-border-card">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[calc(var(--radius-xl)-1px)] bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-semibold">AI gợi ý hành động</p>
                <p className="text-sm text-muted-foreground">
                  Có {overview.ai.recommendationsPending} đề xuất đang chờ bạn xem xét.
                </p>
              </div>
            </div>
            <Button render={<Link href="/ai/recommendations" />}>
              Xem gợi ý <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Kinh doanh — CRM/Sales/Marketing/Bảo hành, chỉ hiện phần user có quyền xem */}
      {(canSeeCrm || canSeeSales || canSeeMarketing || canSeeWarranty) && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Kinh doanh tháng này</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {canSeeCrm && (
              <>
                <KpiCard
                  label="Lead mới tháng này"
                  value={overview.crm.newLeadsThisMonth}
                  icon={UserPlus}
                  tone="primary"
                  href="/crm/leads"
                />
                <KpiCard
                  label="Lead đang xử lý"
                  value={overview.crm.openLeads}
                  icon={Target}
                  tone="muted"
                  hint="Chưa thắng/thua"
                  href="/crm/leads"
                />
              </>
            )}
            {canSeeSales && (
              <>
                <KpiCard
                  label="Đơn hàng tháng này"
                  value={overview.sales.ordersThisMonth}
                  icon={ShoppingCart}
                  tone="primary"
                  href="/sales/orders"
                />
                <KpiCard
                  label="Doanh thu tháng này"
                  value={formatCurrency(overview.sales.revenueThisMonth)}
                  icon={Wallet}
                  tone="primary"
                  hint="Không tính đơn huỷ/hoàn"
                  href="/sales/orders"
                />
              </>
            )}
            {canSeeMarketing && (
              <KpiCard
                label="Chiến dịch đang chạy"
                value={overview.marketing.activeCampaigns}
                icon={Megaphone}
                tone="muted"
                href="/marketing/campaigns"
              />
            )}
            {canSeeWarranty && (
              <KpiCard
                label="Bảo hành còn hạn"
                value={overview.warranty.active}
                icon={BadgeCheck}
                tone="muted"
                hint={overview.warranty.expiringSoon > 0 ? `${overview.warranty.expiringSoon} sắp hết hạn (30 ngày)` : undefined}
                href="/sales/warranty"
              />
            )}
          </div>
        </div>
      )}

      {/* Nội bộ — cơ cấu tổ chức + chấm công */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Nội bộ</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Người dùng đang hoạt động" value={overview.org.users} icon={Users} tone="muted" href="/admin/users" />
          <KpiCard label="Phòng ban" value={overview.org.departments} icon={Building2} tone="muted" href="/admin/departments" />
          <KpiCard label="Nhóm" value={overview.org.teams} icon={UsersRound} tone="muted" href="/admin/teams" />
          {canSeeAttendance && (
            <KpiCard
              label="Chấm công hôm nay"
              value={overview.attendance.checkedInToday ? "Đã vào ca" : "Chưa chấm công"}
              icon={Fingerprint}
              tone={overview.attendance.checkedInToday ? "muted" : "warning"}
              href="/attendance/checkin"
            />
          )}
        </div>
      </div>
    </>
  );
}
