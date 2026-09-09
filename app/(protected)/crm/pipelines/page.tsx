import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import { requirePermission } from "@/lib/auth/rbac";
import { listPipelines } from "@/services/crm/pipelines";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineCreateDialog } from "@/components/crm/pipeline-create-dialog";
import { AddStageForm } from "@/components/crm/add-stage-form";
import { PIPELINE_STAGE_TYPE_LABELS } from "@/lib/crm/types";
import { createPipelineAction, deletePipelineAction, addStageAction, removeStageAction } from "./actions";

export const metadata: Metadata = { title: "Pipeline — VIMOVE OS" };

export default async function PipelinesPage() {
  const session = await requirePermission("sales_catalog.manage");
  const pipelines = await listPipelines(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Cấu hình pipeline & giai đoạn dùng ở trang Lead"
        actions={<PipelineCreateDialog action={createPipelineAction} />}
      />

      {pipelines.length === 0 ? (
        <EmptyState icon={GitBranch} title="Chưa có pipeline nào" description="Tạo pipeline đầu tiên để bắt đầu quản lý lead." />
      ) : (
        <div className="flex flex-col gap-4">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {pipeline.name}
                  {pipeline.isDefault && (
                    <Badge variant="outline" className="border-transparent bg-primary/10 font-normal text-primary">
                      Mặc định
                    </Badge>
                  )}
                  <span className="text-xs font-normal text-muted-foreground">{pipeline._count.leads} lead</span>
                </CardTitle>
                {!pipeline.isDefault && pipeline._count.leads === 0 && (
                  <ConfirmDeleteButton
                    title="Xoá pipeline"
                    description={`Xoá pipeline "${pipeline.name}" — không thể hoàn tác.`}
                    onConfirm={deletePipelineAction.bind(null, pipeline.id)}
                  />
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {pipeline.stages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-1.5 rounded-full border border-border py-1 pr-1 pl-3 text-xs">
                      <span>{stage.name}</span>
                      <span className="text-muted-foreground">({PIPELINE_STAGE_TYPE_LABELS[stage.type]})</span>
                      <ConfirmDeleteButton
                        title="Xoá giai đoạn"
                        description={`Xoá giai đoạn "${stage.name}" — chỉ xoá được khi không còn lead nào ở giai đoạn này.`}
                        onConfirm={removeStageAction.bind(null, stage.id)}
                      />
                    </div>
                  ))}
                </div>
                <AddStageForm action={addStageAction.bind(null, pipeline.id)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
