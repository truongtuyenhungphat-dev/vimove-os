import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, FolderOpen, CheckCircle2, PauseCircle } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listProjects } from "@/services/projects/projects";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectStatusBadge } from "@/components/process/project-badges";
import { ProjectDialog } from "@/components/process/project-dialog";
import { createProjectAction } from "./actions";

export const metadata: Metadata = { title: "Dự án — VIMOVE OS" };

export default async function ProjectsPage() {
  const session = await requirePermission("projects.read");
  const canCreate = hasPermission(session, "projects.create");

  const [projects, users] = await Promise.all([
    listProjects(session.user.organizationId),
    listUsers(session.user.organizationId),
  ]);
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldCount = projects.filter((p) => p.status === "ON_HOLD").length;

  return (
    <>
      <PageHeader
        title="Dự án"
        description="Quản lý dự án, milestone và thành viên"
        actions={canCreate ? <ProjectDialog mode="create" users={activeUsers} action={createProjectAction} /> : undefined}
      />

      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Tổng dự án" value={projects.length} icon={FolderKanban} tone="primary" />
          <KpiCard label="Đang chạy" value={activeCount} icon={FolderOpen} tone="muted" />
          <KpiCard label="Tạm dừng" value={onHoldCount} icon={PauseCircle} tone={onHoldCount > 0 ? "warning" : "muted"} />
          <KpiCard label="Hoàn thành" value={completedCount} icon={CheckCircle2} tone="muted" />
        </div>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={FolderKanban} title="Chưa có dự án nào" description="Tạo dự án đầu tiên để bắt đầu." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{p.name}</p>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{p._count.tasks} công việc</span>
                      <span>{p._count.members} thành viên</span>
                      <span>{p._count.milestones} milestone</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={p.owner.avatarUrl ?? undefined} />
                        <AvatarFallback>{p.owner.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs text-muted-foreground">Chủ dự án: {p.owner.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
