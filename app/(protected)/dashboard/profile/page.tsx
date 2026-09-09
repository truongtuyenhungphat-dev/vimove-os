import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/rbac";
import { getUser } from "@/services/core/users";
import { ROLE_LABELS } from "@/lib/permissions/role-defaults";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileInfoForm, ChangePasswordForm } from "./profile-forms";

export const metadata: Metadata = { title: "Hồ sơ cá nhân — VIMOVE OS" };

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await getUser(session.user.organizationId, session.user.id);

  if (!user) {
    return <p className="text-sm text-muted-foreground">Không tìm thấy hồ sơ.</p>;
  }

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" description={user.email} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vai trò & phòng ban</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Vai trò:</span>
          {user.userRoles.length === 0 && <span className="text-muted-foreground">Chưa gán vai trò</span>}
          {user.userRoles.map((ur) => (
            <Badge key={ur.id} variant="secondary">
              {ROLE_LABELS[ur.role.key] ?? ur.role.name}
            </Badge>
          ))}
          {user.department && (
            <>
              <span className="ml-4 text-muted-foreground">Phòng ban:</span>
              <Badge variant="outline">{user.department.name}</Badge>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileInfoForm name={user.name} title={user.title ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
