import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/rbac";
import { getWorkloadData } from "@/services/tasks/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { WorkloadView } from "@/components/work/workload-view";

export const metadata: Metadata = { title: "Khối lượng công việc — VIMOVE OS" };

export default async function WorkloadPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await requirePermission("tasks.read");
  const params = await searchParams;
  const weekDate = params.week ? new Date(`${params.week}T00:00:00`) : new Date();

  const { weekStart, weekEnd, users, teams } = await getWorkloadData(session.user.organizationId, weekDate);

  return (
    <>
      <PageHeader title="Khối lượng công việc" description="Theo dõi tải công việc theo tuần, người phụ trách và nhóm" />
      <WorkloadView
        weekStart={weekStart}
        weekEnd={weekEnd}
        users={users.map((u) => ({
          id: u.userId,
          name: u.name,
          percent: u.percent,
          tone: u.tone,
          meta: `${u.hours.toFixed(1)}h`,
        }))}
        teams={teams.map((t) => ({
          id: t.teamId,
          name: t.name,
          percent: t.percent,
          tone: t.tone,
          meta: `${t.memberCount} thành viên`,
        }))}
      />
    </>
  );
}
