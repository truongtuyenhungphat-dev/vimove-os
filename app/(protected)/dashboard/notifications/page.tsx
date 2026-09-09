import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { requireSession } from "@/lib/auth/rbac";
import { listNotifications } from "@/services/core/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationList } from "./notification-list";
import { markAllReadAction } from "./actions";

export const metadata: Metadata = { title: "Thông báo — VIMOVE OS" };

export default async function NotificationsPage() {
  const session = await requireSession();
  const notifications = await listNotifications(session.user.id);
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Thông báo hệ thống, đề cập và cập nhật liên quan đến bạn"
        actions={
          hasUnread ? (
            <form action={markAllReadAction}>
              <Button type="submit" variant="outline" size="sm">
                Đánh dấu tất cả đã đọc
              </Button>
            </form>
          ) : undefined
        }
      />

      <Card>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Chưa có thông báo"
              description="Thông báo về task, phê duyệt và nhắc việc sẽ xuất hiện tại đây khi các module tương ứng đi vào hoạt động."
            />
          ) : (
            <NotificationList notifications={notifications} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
