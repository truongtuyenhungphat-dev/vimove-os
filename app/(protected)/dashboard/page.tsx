import type { Metadata } from "next";
import {
  Users,
  Building2,
  UsersRound,
  ClipboardCheck,
  ListTodo,
  AlarmClockOff,
  CheckCircle2,
  UserPlus,
  Target,
  ShoppingCart,
  Wallet,
  Megaphone,
  BadgeCheck,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { requireSession, hasPermission } from "@/lib/auth/rbac";
import { getOrganization } from "@/services/core/organization";
import { getDashboardOverview } from "@/services/core/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard — VIMOVE OS" };

function formatCurrency(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-muted-foreground">{children}</h2>;
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

      {/* Cần bạn xử lý */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chờ bạn phê duyệt"
          value={overview.approvals.pending}
          icon={ClipboardCheck}
          tone={overview.approvals.pending > 0 ? "warning" : "muted"}
          hint="Approval Hub"
          href="/work/approvals"
        />
        {canSeeWork && (
          <>
            <KpiCard
              label="Việc đến hạn hôm nay"
              value={overview.work.dueToday}
              icon={ListTodo}
              tone={overview.work.dueToday > 0 ? "primary" : "muted"}
              href="/work/my-tasks"
            />
            <KpiCard
              label="Việc quá hạn"
              value={overview.work.overdue}
              icon={AlarmClockOff}
              tone={overview.work.overdue > 0 ? "warning" : "muted"}
              href="/work/my-tasks"
            />
            <KpiCard
              label="Hoàn thành tuần này"
              value={overview.work.completedThisWeek}
              icon={CheckCircle2}
              tone="muted"
              hint="Toàn tổ chức"
              href="/work/tasks"
            />
          </>
        )}
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Bấm vào bất kỳ ô số liệu nào ở trên để đi thẳng tới trang chi tiết của module đó — Dashboard chỉ tổng
            hợp số liệu thật, không có dữ liệu minh hoạ.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
