import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { getProject } from "@/services/projects/projects";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { ProjectStatusBadge } from "@/components/process/project-badges";
import { ProjectDialog } from "@/components/process/project-dialog";
import { MilestonesPanel } from "@/components/process/project-detail/milestones-panel";
import { MembersPanel } from "@/components/process/project-detail/members-panel";
import { FilesPanel } from "@/components/process/project-detail/files-panel";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/work/task-badges";
import type { TaskStatus, TaskPriority } from "@/lib/work/types";
import {
  updateProjectAction,
  deleteProjectAction,
  addMemberAction,
  removeMemberAction,
  addMilestoneAction,
  toggleMilestoneAction,
  removeMilestoneAction,
  addFileLinkAction,
  removeFileAction,
} from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params;
  return { title: "Dự án — VIMOVE OS", description: projectId };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await requirePermission("projects.read");
  const { projectId } = await params;

  const project = await getProject(session.user.organizationId, projectId);
  if (!project) notFound();

  const canEdit = hasPermission(session, "projects.update");
  const canDelete = hasPermission(session, "projects.delete");

  const users = await listUsers(session.user.organizationId);
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));
  const memberIds = new Set(project.members.map((m) => m.userId));
  const candidateUsers = activeUsers.filter((u) => !memberIds.has(u.id));

  return (
    <>
      <PageHeader
        title={project.name}
        description={`Chủ dự án: ${project.owner.name}`}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {canEdit && (
              <ProjectDialog
                mode="edit"
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  status: project.status,
                  startAt: project.startAt ? format(project.startAt, "yyyy-MM-dd") : null,
                  endAt: project.endAt ? format(project.endAt, "yyyy-MM-dd") : null,
                }}
                users={activeUsers}
                action={updateProjectAction.bind(null, project.id)}
              />
            )}
            {canDelete && (
              <ConfirmDeleteButton
                title="Xoá dự án"
                description={`Xoá "${project.name}" — không thể hoàn tác. Công việc thuộc dự án sẽ không bị xoá.`}
                onConfirm={deleteProjectAction.bind(null, project.id)}
              />
            )}
          </div>
        }
      />

      {project.description && (
        <Card>
          <CardContent className="text-sm whitespace-pre-wrap">{project.description}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Tabs defaultValue="milestones">
            <TabsList>
              <TabsTrigger value="milestones">Milestone ({project.milestones.length})</TabsTrigger>
              <TabsTrigger value="members">Thành viên ({project._count.members})</TabsTrigger>
              <TabsTrigger value="tasks">Công việc ({project._count.tasks})</TabsTrigger>
              <TabsTrigger value="files">File</TabsTrigger>
            </TabsList>
            <TabsContent value="milestones" className="pt-3">
              <MilestonesPanel
                milestones={project.milestones.map((m) => ({
                  id: m.id,
                  name: m.name,
                  dueAt: m.dueAt ? m.dueAt.toISOString() : null,
                  status: m.status,
                }))}
                canEdit={canEdit}
                onAdd={addMilestoneAction.bind(null, project.id)}
                onToggle={toggleMilestoneAction.bind(null, project.id)}
                onRemove={removeMilestoneAction.bind(null, project.id)}
              />
            </TabsContent>
            <TabsContent value="members" className="pt-3">
              <MembersPanel
                ownerId={project.ownerId}
                members={project.members.map((m) => ({ userId: m.userId, name: m.user.name, role: m.role }))}
                candidateUsers={candidateUsers}
                canEdit={canEdit}
                onAdd={addMemberAction.bind(null, project.id)}
                onRemove={removeMemberAction.bind(null, project.id)}
              />
            </TabsContent>
            <TabsContent value="tasks" className="pt-3">
              <div className="flex flex-col gap-1.5">
                {project.tasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/work/tasks/${t.id}`}
                    className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 hover:bg-accent"
                  >
                    <span className="flex-1 truncate text-sm">{t.title}</span>
                    <TaskPriorityBadge priority={t.priority as TaskPriority} />
                    <TaskStatusBadge status={t.status as TaskStatus} />
                    <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">{t.assignee?.name ?? "Chưa gán"}</span>
                  </Link>
                ))}
                {project.tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có công việc nào gắn với dự án này — mở 1 công việc ở Work Hub và chọn dự án này trong
                    mục Sửa.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="files" className="pt-3">
              <FilesPanel
                files={project.files}
                canEdit={canEdit}
                onAdd={addFileLinkAction.bind(null, project.id)}
                onRemove={removeFileAction.bind(null, project.id)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
