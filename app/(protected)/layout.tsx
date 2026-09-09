import { requireSession } from "@/lib/auth/rbac";
import { countUnreadNotifications } from "@/services/core/notifications";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const unreadNotifications = await countUnreadNotifications(session.user.id);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar permissions={session.user.permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          userName={session.user.name ?? session.user.email ?? "Người dùng"}
          userEmail={session.user.email ?? ""}
          unreadNotifications={unreadNotifications}
          permissions={session.user.permissions}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
