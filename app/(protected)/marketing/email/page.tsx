import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listEmailCampaigns } from "@/services/marketing/email-campaigns";
import { listCampaigns } from "@/services/marketing/campaigns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmailCampaignDialog } from "@/components/marketing/email-campaign-dialog";
import { EmailStatusSelect } from "@/components/marketing/email-status-select";
import { createEmailCampaignAction, updateEmailCampaignStatusAction, deleteEmailCampaignAction } from "./actions";

export const metadata: Metadata = { title: "Email Campaign — VIMOVE OS" };

export default async function EmailCampaignsPage() {
  const session = await requirePermission("marketing_channels.read");
  const canManage = hasPermission(session, "marketing_channels.manage");

  const [emails, campaigns] = await Promise.all([
    listEmailCampaigns(session.user.organizationId),
    listCampaigns(session.user.organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Email Campaign"
        description="Chưa nối provider email thật — trạng thái Đã gửi chỉ đánh dấu thủ công"
        actions={canManage ? <EmailCampaignDialog campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} action={createEmailCampaignAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {emails.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Mail} title="Chưa có email campaign nào" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Chiến dịch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{e.campaign?.name ?? "—"}</TableCell>
                    <TableCell>
                      {canManage ? (
                        <EmailStatusSelect emailId={e.id} status={e.status} onChange={updateEmailCampaignStatusAction} />
                      ) : (
                        e.status
                      )}
                    </TableCell>
                    <TableCell>
                      {canManage && <ConfirmDeleteButton title="Xoá email campaign" description={`Xoá "${e.name}"?`} onConfirm={deleteEmailCampaignAction.bind(null, e.id)} />}
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
