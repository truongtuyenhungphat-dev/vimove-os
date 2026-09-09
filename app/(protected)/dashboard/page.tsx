import type { Metadata } from "next";
import { Users, Building2, UsersRound, ClipboardCheck } from "lucide-react";
import { requireSession } from "@/lib/auth/rbac";
import { getDashboardCounts, getOrganization } from "@/services/core/organization";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard — VIMOVE OS" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const session = await requireSession();
  const { denied } = await searchParams;
  const [counts, organization] = await Promise.all([
    getDashboardCounts(session.user.organizationId, session.user.id),
    getOrganization(session.user.organizationId),
  ]);

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
        description={`${organization.name} — tổng quan hệ thống`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Người dùng đang hoạt động" value={counts.users} icon={Users} />
        <KpiCard label="Phòng ban" value={counts.departments} icon={Building2} />
        <KpiCard label="Nhóm" value={counts.teams} icon={UsersRound} />
        <KpiCard
          label="Chờ bạn phê duyệt"
          value={counts.pendingApprovals}
          icon={ClipboardCheck}
          tone={counts.pendingApprovals > 0 ? "primary" : "muted"}
          hint={counts.pendingApprovals > 0 ? "Xem ở Approval Hub" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lộ trình triển khai</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Phase 1 (Foundation), Phase 2 (Work Hub) và Phase 3 (Project & Process — Dự án,
            Workflow Builder, Approval Hub) đã hoàn thành. Marketing Hub, CRM/Sales, Analytics và AI
            Command Center sẽ được mở khoá dần trong các phase tiếp theo — xem{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              docs/00-phuong-an-trien-khai.md
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </>
  );
}
