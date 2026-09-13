import type { Metadata } from "next";
import { Store, Globe, Building2, Handshake, ShoppingBag, MoreHorizontal } from "lucide-react";
import { requirePermission } from "@/lib/auth/rbac";
import { listSalesChannels } from "@/services/sales/channels";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChannelDialog } from "@/components/sales/channel-dialog";
import { SALES_CHANNEL_TYPE_LABELS, type SalesChannelType } from "@/lib/sales/types";
import { createChannelAction, updateChannelAction, deleteChannelAction } from "./actions";

export const metadata: Metadata = { title: "Kênh bán — VIMOVE OS" };

const CHANNEL_TYPE_ICON: Record<SalesChannelType, typeof Store> = {
  ONLINE: Globe,
  RETAIL: Building2,
  PARTNER: Handshake,
  MARKETPLACE: ShoppingBag,
  OTHER: MoreHorizontal,
};

export default async function SalesChannelsPage() {
  const session = await requirePermission("sales_catalog.manage");
  const channels = await listSalesChannels(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Kênh bán"
        description="Quản lý kênh bán hàng (Online, cửa hàng, đối tác, sàn TMĐT...)"
        actions={<ChannelDialog mode="create" action={createChannelAction} />}
      />

      <Card>
        <CardContent className="p-0">
          {channels.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Store} title="Chưa có kênh bán nào" description="Thêm kênh bán đầu tiên để gắn vào đơn hàng." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên kênh</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((c) => {
                  const Icon = CHANNEL_TYPE_ICON[c.type];
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="size-4" />
                          </div>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{SALES_CHANNEL_TYPE_LABELS[c.type]}</TableCell>
                      <TableCell className="text-muted-foreground">{c._count.orders}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={c.isActive ? "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-transparent bg-muted text-muted-foreground"}>
                          {c.isActive ? "Đang hoạt động" : "Ngừng"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <ChannelDialog mode="edit" channel={c} action={updateChannelAction.bind(null, c.id)} />
                          <ConfirmDeleteButton
                            title="Xoá kênh bán"
                            description={`Xoá kênh "${c.name}" — không thể hoàn tác.`}
                            onConfirm={deleteChannelAction.bind(null, c.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
