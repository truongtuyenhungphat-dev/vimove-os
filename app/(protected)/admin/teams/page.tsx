import type { Metadata } from "next";
import { UsersRound } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listTeams } from "@/services/core/teams";
import { listDepartments } from "@/services/core/departments";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamDialog } from "./team-dialog";
import { TeamMembersDialog } from "./team-members-dialog";
import { createTeamAction, updateTeamAction, deleteTeamAction } from "./actions";

export const metadata: Metadata = { title: "Nhóm — VIMOVE OS" };

export default async function TeamsPage() {
  const session = await requirePermission("teams.read");
  const canCreate = hasPermission(session, "teams.create");
  const canUpdate = hasPermission(session, "teams.update");
  const canDelete = hasPermission(session, "teams.delete");

  const [teams, departments, users] = await Promise.all([
    listTeams(session.user.organizationId),
    listDepartments(session.user.organizationId),
    listUsers(session.user.organizationId),
  ]);

  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }));
  const userOptions = users.map((u) => ({ id: u.id, name: u.name, email: u.email }));

  return (
    <>
      <PageHeader
        title="Nhóm"
        description="Nhóm làm việc trong tổ chức"
        actions={canCreate ? <TeamDialog mode="create" departments={departmentOptions} action={createTeamAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {teams.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={UsersRound} title="Chưa có nhóm nào" description="Tạo nhóm đầu tiên để bắt đầu." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead className="text-right">Thành viên</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground">{team.department?.name ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{team._count.members}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <TeamMembersDialog
                            teamId={team.id}
                            teamName={team.name}
                            users={userOptions}
                            currentMemberIds={team.members.map((m) => m.userId)}
                          />
                        )}
                        {canUpdate && (
                          <TeamDialog
                            mode="edit"
                            team={team}
                            departments={departmentOptions}
                            action={updateTeamAction.bind(null, team.id)}
                          />
                        )}
                        {canDelete && (
                          <ConfirmDeleteButton
                            title="Xoá nhóm?"
                            description={`Nhóm "${team.name}" và toàn bộ thành viên sẽ bị xoá khỏi nhóm.`}
                            onConfirm={deleteTeamAction.bind(null, team.id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
