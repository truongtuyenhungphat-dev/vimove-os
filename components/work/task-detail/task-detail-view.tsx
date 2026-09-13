"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { TaskPriorityBadge } from "../task-badges";
import { TaskDialog } from "../task-dialog";
import { ChecklistPanel, type ChecklistItem } from "./checklist-panel";
import { CommentsPanel, type TaskCommentItem } from "./comments-panel";
import { AttachmentsPanel, type TaskAttachmentItem } from "./attachments-panel";
import { DependenciesPanel, type DependencyItem } from "./dependencies-panel";
import { TimeLogPanel, type TimeLogItem } from "./time-log-panel";
import { ActivityFeed, type ActivityItem } from "./activity-feed";
import { WatchButton } from "./watch-button";
import { RequestApprovalDialog } from "./request-approval-dialog";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus, type TaskPriority } from "@/lib/work/types";

type TaskDetailData = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  teamId: string | null;
  projectId: string | null;
  startAt: string | null;
  dueAt: string | null;
  estimateHours: number | null;
  tagIds: string[];
  assignee: { id: string; name: string } | null;
  creator: { name: string };
  team: { name: string } | null;
  project: { id: string; name: string } | null;
};

export function TaskDetailView({
  task,
  currentUserId,
  canEdit,
  canDelete,
  isWatching,
  checklistItems,
  comments,
  attachments,
  dependsOn,
  dependents,
  candidateTasks,
  timeLogs,
  activities,
  assignees,
  teams,
  projects,
  tags,
  onUpdateTask,
  onDeleteTask,
  actions,
}: {
  task: TaskDetailData;
  currentUserId: string;
  canEdit: boolean;
  canDelete: boolean;
  isWatching: boolean;
  checklistItems: ChecklistItem[];
  comments: TaskCommentItem[];
  attachments: TaskAttachmentItem[];
  dependsOn: DependencyItem[];
  dependents: DependencyItem[];
  candidateTasks: { id: string; title: string }[];
  timeLogs: TimeLogItem[];
  activities: ActivityItem[];
  assignees: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  tags: { id: string; name: string; color: string }[];
  onUpdateTask: (formData: FormData) => Promise<void>;
  onDeleteTask: () => Promise<void>;
  actions: {
    changeStatus: (status: TaskStatus) => Promise<void>;
    toggleWatch: () => Promise<{ watching: boolean }>;
    addChecklistItem: (title: string) => Promise<void>;
    toggleChecklistItem: (itemId: string, isDone: boolean) => Promise<void>;
    removeChecklistItem: (itemId: string) => Promise<void>;
    addComment: (body: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    addAttachment: (data: { label: string; url: string }) => Promise<void>;
    removeAttachment: (attachmentId: string) => Promise<void>;
    addDependency: (dependsOnTaskId: string) => Promise<void>;
    removeDependency: (dependencyId: string) => Promise<void>;
    addTimeLog: (data: { minutes: number; note: string | null }) => Promise<void>;
    removeTimeLog: (logId: string) => Promise<void>;
    requestApproval: (data: { mode: "SEQUENTIAL" | "PARALLEL"; slaHours: number | null; approverIds: string[] }) => Promise<void>;
  };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Mô tả</p>
            <p className="text-sm whitespace-pre-wrap">{task.description || "Chưa có mô tả."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Tabs defaultValue="checklist">
              <TabsList>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="comments">Bình luận ({comments.length})</TabsTrigger>
                <TabsTrigger value="attachments">Đính kèm</TabsTrigger>
                <TabsTrigger value="dependencies">Phụ thuộc</TabsTrigger>
                <TabsTrigger value="time">Thời gian</TabsTrigger>
                <TabsTrigger value="activity">Hoạt động</TabsTrigger>
              </TabsList>
              <TabsContent value="checklist" className="pt-3">
                <ChecklistPanel
                  items={checklistItems}
                  canEdit={canEdit}
                  onAdd={actions.addChecklistItem}
                  onToggle={actions.toggleChecklistItem}
                  onRemove={actions.removeChecklistItem}
                />
              </TabsContent>
              <TabsContent value="comments" className="pt-3">
                <CommentsPanel
                  comments={comments}
                  currentUserId={currentUserId}
                  canDeleteAny={canDelete}
                  onAdd={actions.addComment}
                  onDelete={actions.deleteComment}
                />
              </TabsContent>
              <TabsContent value="attachments" className="pt-3">
                <AttachmentsPanel
                  attachments={attachments}
                  canEdit={canEdit}
                  onAdd={actions.addAttachment}
                  onRemove={actions.removeAttachment}
                />
              </TabsContent>
              <TabsContent value="dependencies" className="pt-3">
                <DependenciesPanel
                  dependsOn={dependsOn}
                  dependents={dependents}
                  candidateTasks={candidateTasks}
                  canEdit={canEdit}
                  onAdd={actions.addDependency}
                  onRemove={actions.removeDependency}
                />
              </TabsContent>
              <TabsContent value="time" className="pt-3">
                <TimeLogPanel
                  logs={timeLogs}
                  currentUserId={currentUserId}
                  canDeleteAny={canDelete}
                  onAdd={actions.addTimeLog}
                  onRemove={actions.removeTimeLog}
                />
              </TabsContent>
              <TabsContent value="activity" className="pt-3">
                <ActivityFeed activities={activities} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
              <Select
                items={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
                value={task.status}
                disabled={!canEdit || isPending}
                onValueChange={(v) =>
                  startTransition(async () => {
                    try {
                      await actions.changeStatus(v as TaskStatus);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
                    }
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Độ ưu tiên</p>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Người phụ trách</p>
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <Avatar size="sm">
                    <AvatarFallback>{task.assignee.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Chưa gán</span>
              )}
            </div>

            {task.team && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Nhóm</p>
                <span className="text-sm">{task.team.name}</span>
              </div>
            )}
            {task.project && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Dự án</p>
                <Link href={`/projects/${task.project.id}`} className="text-sm text-primary hover:underline">
                  {task.project.name}
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Bắt đầu</p>
              <span className="text-sm">{task.startAt ? format(new Date(task.startAt), "dd/MM/yyyy") : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Hạn hoàn thành</p>
              <span className="text-sm">{task.dueAt ? format(new Date(task.dueAt), "dd/MM/yyyy") : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Ước lượng</p>
              <span className="text-sm">{task.estimateHours ? `${task.estimateHours} giờ` : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Người tạo</p>
              <span className="text-sm">{task.creator.name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <WatchButton watching={isWatching} onToggle={actions.toggleWatch} />
              {canEdit && (
                <RequestApprovalDialog taskTitle={task.title} users={assignees} onSubmit={actions.requestApproval} />
              )}
              {canEdit && (
                <TaskDialog
                  mode="edit"
                  task={{
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    assigneeId: task.assigneeId,
                    teamId: task.teamId,
                    projectId: task.projectId,
                    startAt: task.startAt,
                    dueAt: task.dueAt,
                    estimateHours: task.estimateHours,
                    tagIds: task.tagIds,
                  }}
                  assignees={assignees}
                  teams={teams}
                  projects={projects}
                  tags={tags}
                  action={onUpdateTask}
                />
              )}
              {canDelete && (
                <ConfirmDeleteButton
                  title="Xoá công việc"
                  description={`Xoá "${task.title}" — không thể hoàn tác.`}
                  onConfirm={onDeleteTask}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
