import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import type { PipelineStageType } from "@/lib/crm/types";

export async function listPipelines(organizationId: string) {
  return prisma.pipeline.findMany({
    where: { organizationId },
    include: { stages: { orderBy: { position: "asc" } }, _count: { select: { leads: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDefaultPipeline(organizationId: string) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId, isDefault: true },
    include: { stages: { orderBy: { position: "asc" } } },
  });
  if (pipeline) return pipeline;
  // Fallback: pipeline đầu tiên nếu chưa đánh dấu isDefault (không nên xảy ra vì
  // createPipeline luôn đảm bảo có đúng 1 default, nhưng vẫn phòng hờ).
  return prisma.pipeline.findFirst({
    where: { organizationId },
    include: { stages: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPipeline(organizationId: string, id: string) {
  return prisma.pipeline.findFirst({
    where: { id, organizationId },
    include: { stages: { orderBy: { position: "asc" } } },
  });
}

export async function createPipeline(
  organizationId: string,
  actorId: string,
  data: { name: string; stages: { name: string; type: PipelineStageType }[] }
) {
  const existingCount = await prisma.pipeline.count({ where: { organizationId } });
  const pipeline = await prisma.pipeline.create({
    data: {
      organizationId,
      name: data.name,
      isDefault: existingCount === 0,
      stages: { create: data.stages.map((s, index) => ({ name: s.name, type: s.type, position: index })) },
    },
    include: { stages: true },
  });
  await writeAuditLog({ organizationId, actorId, action: "pipeline.create", entityType: "Pipeline", entityId: pipeline.id, after: { name: pipeline.name } });
  return pipeline;
}

export async function renamePipeline(organizationId: string, actorId: string, id: string, name: string) {
  const before = await prisma.pipeline.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy pipeline");
  const updated = await prisma.pipeline.update({ where: { id }, data: { name } });
  await writeAuditLog({ organizationId, actorId, action: "pipeline.update", entityType: "Pipeline", entityId: id, before: { name: before.name }, after: { name } });
  return updated;
}

export async function deletePipeline(organizationId: string, actorId: string, id: string) {
  const pipeline = await prisma.pipeline.findFirst({ where: { id, organizationId }, include: { _count: { select: { leads: true } } } });
  if (!pipeline) throw new Error("Không tìm thấy pipeline");
  if (pipeline.isDefault) throw new Error("Không thể xoá pipeline mặc định");
  if (pipeline._count.leads > 0) throw new Error("Pipeline đang có lead, không thể xoá");
  await prisma.pipeline.delete({ where: { id } });
  await writeAuditLog({ organizationId, actorId, action: "pipeline.delete", entityType: "Pipeline", entityId: id, before: { name: pipeline.name } });
}

export async function addStage(organizationId: string, pipelineId: string, data: { name: string; type: PipelineStageType }) {
  const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId } });
  if (!pipeline) throw new Error("Không tìm thấy pipeline");
  const last = await prisma.pipelineStage.findFirst({ where: { pipelineId }, orderBy: { position: "desc" } });
  return prisma.pipelineStage.create({
    data: { pipelineId, name: data.name, type: data.type, position: (last?.position ?? -1) + 1 },
  });
}

export async function removeStage(organizationId: string, stageId: string) {
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, pipeline: { organizationId } },
    include: { _count: { select: { leads: true } } },
  });
  if (!stage) throw new Error("Không tìm thấy giai đoạn");
  if (stage._count.leads > 0) throw new Error("Giai đoạn đang có lead, không thể xoá");
  await prisma.pipelineStage.delete({ where: { id: stageId } });
}
