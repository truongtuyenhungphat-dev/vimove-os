import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, Wallet, CalendarClock } from "lucide-react";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { getLead } from "@/services/crm/leads";
import { getPipeline } from "@/services/crm/pipelines";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadDialog } from "@/components/crm/lead-dialog";
import { LeadDetailView } from "@/components/crm/lead-detail-view";
import { LEAD_SOURCE_LABELS, PIPELINE_STAGE_TYPE_LABELS } from "@/lib/crm/types";
import { updateLeadAction, deleteLeadAction, moveLeadStageAction, addLeadActivityAction, convertLeadAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết lead — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const STAGE_TYPE_STYLE: Record<string, string> = {
  OPEN: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  WON: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  LOST: "bg-destructive/10 text-destructive",
};

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const session = await requirePermission("leads.read");
  const { leadId } = await params;
  const lead = await getLead(session.user.organizationId, leadId, buildVisibilityScope(session, "leads.read"));
  if (!lead) notFound();

  const [pipeline, users] = await Promise.all([
    getPipeline(session.user.organizationId, lead.pipeline.id),
    listUsers(session.user.organizationId),
  ]);

  const canUpdate = hasPermission(session, "leads.update");
  const canDelete = hasPermission(session, "leads.delete");
  const activeUsers = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  return (
    <>
      <PageHeader
        title={lead.name}
        description={`Pipeline: ${lead.pipeline.name}`}
        actions={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <LeadDialog
                mode="edit"
                lead={{
                  id: lead.id,
                  name: lead.name,
                  contactName: lead.contactName,
                  email: lead.email,
                  phone: lead.phone,
                  source: lead.source,
                  value: lead.value,
                  ownerId: lead.ownerId,
                }}
                owners={activeUsers}
                action={updateLeadAction.bind(null, lead.id)}
              />
            )}
            {canDelete && (
              <ConfirmDeleteButton title="Xoá lead" description={`Xoá lead "${lead.name}" — không thể hoàn tác.`} onConfirm={deleteLeadAction.bind(null, lead.id)} />
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="border-transparent bg-muted font-normal">
          {LEAD_SOURCE_LABELS[lead.source]}
        </Badge>
        <Badge variant="outline" className={`border-transparent font-normal ${STAGE_TYPE_STYLE[lead.stage.type]}`}>
          {lead.stage.name} · {PIPELINE_STAGE_TYPE_LABELS[lead.stage.type]}
        </Badge>
        {lead.value !== null && (
          <Badge variant="outline" className="flex items-center gap-1 border-transparent bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400">
            <Wallet className="size-3" /> {formatVnd(lead.value)}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeadDetailView
            leadId={lead.id}
            stageId={lead.stage.id}
            stages={pipeline?.stages ?? []}
            activities={lead.activities.map((a) => ({ ...a, createdAt: a.createdAt.toString() }))}
            canConvert={canUpdate && !lead.customer && lead.stage.type !== "LOST"}
            canUpdate={canUpdate}
            onMoveStage={moveLeadStageAction}
            onAddActivity={addLeadActivityAction}
            onConvert={convertLeadAction}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={lead.owner?.avatarUrl ?? undefined} />
                  <AvatarFallback>{(lead.owner?.name ?? lead.contactName ?? lead.name).slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{lead.contactName ?? lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.owner ? `Phụ trách bởi ${lead.owner.name}` : "Chưa có người phụ trách"}</p>
                </div>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span className="text-foreground">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  <span className="text-foreground">{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="size-4 shrink-0" />
                <span className="text-foreground">Tạo lúc {new Date(lead.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
              {lead.customer && (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground">Đã chuyển thành khách hàng</p>
                  <Link href={`/crm/customers/${lead.customer.id}`} className="font-medium text-primary hover:underline">
                    {lead.customer.name}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
