import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import { getLead } from "@/services/crm/leads";
import { getPipeline } from "@/services/crm/pipelines";
import { listUsers } from "@/services/core/users";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadDialog } from "@/components/crm/lead-dialog";
import { LeadDetailView } from "@/components/crm/lead-detail-view";
import { LEAD_SOURCE_LABELS } from "@/lib/crm/types";
import { updateLeadAction, deleteLeadAction, moveLeadStageAction, addLeadActivityAction, convertLeadAction } from "../actions";

export const metadata: Metadata = { title: "Chi tiết lead — VIMOVE OS" };

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

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
        description={`Pipeline: ${lead.pipeline.name} · Nguồn: ${LEAD_SOURCE_LABELS[lead.source]}`}
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

        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 text-sm">
            {lead.contactName && (
              <div>
                <p className="text-muted-foreground">Người liên hệ</p>
                <p className="font-medium">{lead.contactName}</p>
              </div>
            )}
            {lead.email && (
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div>
                <p className="text-muted-foreground">Điện thoại</p>
                <p>{lead.phone}</p>
              </div>
            )}
            {lead.value !== null && (
              <div>
                <p className="text-muted-foreground">Giá trị ước tính</p>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatVnd(lead.value)}</p>
              </div>
            )}
            {lead.owner && (
              <div>
                <p className="text-muted-foreground">Người phụ trách</p>
                <p>{lead.owner.name}</p>
              </div>
            )}
            {lead.customer && (
              <div>
                <p className="text-muted-foreground">Khách hàng</p>
                <Link href={`/crm/customers/${lead.customer.id}`} className="font-medium text-primary hover:underline">
                  {lead.customer.name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
