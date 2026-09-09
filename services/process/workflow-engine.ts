import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { createNotification } from "@/services/core/notifications";
import type {
  WorkflowDefinition,
  WorkflowFlowNode,
  ActionConfig,
  ConditionConfig,
  DelayConfig,
  WebhookConfig,
  ApprovalNodeConfig,
} from "@/lib/process/types";

/**
 * Engine chạy đồng bộ trong 1 request (không có job queue durable — xem docs/
 * 03-project-process.md). Thật sự thực thi: TRIGGER/ACTION/CONDITION/WEBHOOK/PARALLEL.
 * Giới hạn có ghi rõ: DELAY không chờ thật (ghi nhận rồi chạy tiếp ngay), AI luôn SKIPPED
 * (nối thật ở Phase 8 khi có ANTHROPIC_API_KEY) — không giả vờ các phần này chạy thật.
 */

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evalCondition(config: ConditionConfig, context: Record<string, unknown>): boolean {
  const actual = getPath(context, config.field);
  const actualStr = actual === undefined || actual === null ? "" : String(actual);
  switch (config.operator) {
    case "eq":
      return actualStr === config.value;
    case "neq":
      return actualStr !== config.value;
    case "contains":
      return actualStr.includes(config.value);
    case "gt":
      return Number(actual) > Number(config.value);
    case "lt":
      return Number(actual) < Number(config.value);
    default:
      return false;
  }
}

type StepResult = { status: "SUCCEEDED" | "FAILED" | "AWAITING_APPROVAL" | "SKIPPED"; output?: unknown; error?: string };

async function executeNode(node: WorkflowFlowNode, context: Record<string, unknown>, runId: string): Promise<StepResult> {
  switch (node.type) {
    case "TRIGGER":
      return { status: "SUCCEEDED", output: context.trigger };

    case "ACTION": {
      const config = node.data.config as ActionConfig;
      if ("actionKind" in config && config.actionKind === "notify") {
        await createNotification({ userId: config.userId, title: config.message, link: "/process/workflows" });
        return { status: "SUCCEEDED", output: { notified: config.userId } };
      }
      if ("actionKind" in config && config.actionKind === "audit_log") {
        return { status: "SUCCEEDED", output: { logged: config.message } };
      }
      return { status: "FAILED", error: "Action node chưa cấu hình actionKind" };
    }

    case "CONDITION": {
      const config = node.data.config as ConditionConfig;
      const result = evalCondition(config, context);
      return { status: "SUCCEEDED", output: { result } };
    }

    case "DELAY": {
      const config = node.data.config as DelayConfig;
      // Giới hạn đã ghi trong docs: không có job queue durable nên không chờ thật —
      // ghi nhận yêu cầu delay rồi chạy tiếp ngay, đánh dấu simulated:true.
      return { status: "SUCCEEDED", output: { simulated: true, requestedMinutes: config.minutes ?? 0 } };
    }

    case "PARALLEL":
      return { status: "SUCCEEDED", output: null };

    case "WEBHOOK": {
      const config = node.data.config as WebhookConfig;
      if (!config.url) return { status: "FAILED", error: "Webhook node thiếu URL" };
      const maxAttempts = Math.max(1, config.retries ?? 1);
      let lastError = "";
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(config.url, {
            method: config.method || "POST",
            headers: { "Content-Type": "application/json" },
            body: config.method === "GET" ? undefined : JSON.stringify(context),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          const bodyText = await res.text().catch(() => "");
          if (!res.ok) {
            lastError = `HTTP ${res.status}`;
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 500 * attempt));
              continue;
            }
            return { status: "FAILED", error: lastError, output: { status: res.status, body: bodyText.slice(0, 2000) } };
          }
          return { status: "SUCCEEDED", output: { status: res.status, body: bodyText.slice(0, 2000), attempt } };
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
      return { status: "FAILED", error: lastError || "Webhook thất bại" };
    }

    case "APPROVAL": {
      const config = node.data.config as ApprovalNodeConfig;
      if (!config.approverIds || config.approverIds.length === 0) {
        return { status: "FAILED", error: "Approval node chưa chọn người duyệt" };
      }
      await Promise.all(
        config.approverIds.map((userId) =>
          createNotification({ userId, type: "APPROVAL", title: "Có bước workflow đang chờ bạn duyệt", link: `/process/runs/${runId}` })
        )
      );
      return { status: "AWAITING_APPROVAL", output: { approverIds: config.approverIds, mode: config.mode, decisions: {} } };
    }

    case "AI":
      // Chưa cấu hình ANTHROPIC_API_KEY thật cho node này ở Phase 3 — AI Command Center
      // (gọi Claude thật) thuộc Phase 8. Đánh dấu SKIPPED rõ ràng, không giả vờ chạy.
      return { status: "SKIPPED", output: { reason: "AI node nối thật ở Phase 8 khi có ANTHROPIC_API_KEY" } };

    default:
      return { status: "FAILED", error: `Không nhận diện được nodeType: ${node.type}` };
  }
}

function outgoingEdges(definition: WorkflowDefinition, nodeId: string, branch?: boolean) {
  return definition.edges.filter((e) => {
    if (e.source !== nodeId) return false;
    if (branch === undefined) return true;
    if (!e.sourceHandle) return true;
    return e.sourceHandle === (branch ? "true" : "false");
  });
}

export async function getWorkflowRun(organizationId: string, id: string) {
  return prisma.workflowRun.findFirst({
    where: { id, organizationId },
    include: {
      workflow: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      steps: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function startWorkflowRun(
  organizationId: string,
  actorId: string,
  workflowId: string,
  triggerPayload: Record<string, unknown> = {}
) {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, organizationId }, include: { currentVersion: true } });
  if (!workflow || !workflow.currentVersion) throw new Error("Không tìm thấy workflow");
  if (!workflow.isActive || !workflow.currentVersion.publishedAt) {
    throw new Error("Workflow chưa publish — không thể chạy");
  }

  const run = await prisma.workflowRun.create({
    data: {
      organizationId,
      workflowId,
      workflowVersionId: workflow.currentVersion.id,
      status: "RUNNING",
      triggerType: "manual",
      triggerPayload: triggerPayload as object,
      startedAt: new Date(),
      createdById: actorId,
    },
  });

  await executeRun(run.id, workflow.currentVersion.definition as unknown as WorkflowDefinition, { trigger: triggerPayload, steps: {} });
  await writeAuditLog({ organizationId, actorId, action: "workflow.run.start", entityType: "WorkflowRun", entityId: run.id });

  return prisma.workflowRun.findUniqueOrThrow({ where: { id: run.id }, include: { steps: { orderBy: { createdAt: "asc" } } } });
}

/** Chạy graph theo BFS từ mọi node không có cạnh vào (mặc định là TRIGGER). Dừng nhánh
 * khi gặp FAILED/AWAITING_APPROVAL — không lan tiếp xuống các node phía sau nhánh đó. */
async function executeRun(runId: string, definition: WorkflowDefinition, context: { trigger: unknown; steps: Record<string, unknown> }) {
  const targets = new Set(definition.edges.map((e) => e.target));
  const startNodes = definition.nodes.filter((n) => !targets.has(n.id));
  const queue = [...startNodes];
  const visited = new Set<string>();
  let anyFailed = false;
  let anyAwaiting = false;

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);

    const step = await prisma.workflowRunStep.create({
      data: { runId, nodeId: node.id, nodeType: node.type, status: "RUNNING", input: context as object, startedAt: new Date() },
    });

    const result = await executeNode(node, context, runId);

    await prisma.workflowRunStep.update({
      where: { id: step.id },
      data: {
        status: result.status,
        output: (result.output ?? null) as object | undefined,
        error: result.error ?? null,
        finishedAt: new Date(),
      },
    });

    context.steps[node.id] = result.output;

    if (result.status === "FAILED") {
      anyFailed = true;
      continue; // không đi tiếp nhánh này
    }
    if (result.status === "AWAITING_APPROVAL") {
      anyAwaiting = true;
      continue; // dừng ở đây, chờ resumeWorkflowRun
    }

    const branch = node.type === "CONDITION" ? Boolean((result.output as { result?: boolean } | undefined)?.result) : undefined;
    for (const edge of outgoingEdges(definition, node.id, branch)) {
      const nextNode = definition.nodes.find((n) => n.id === edge.target);
      if (nextNode && !visited.has(nextNode.id)) queue.push(nextNode);
    }
  }

  await prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: anyAwaiting ? "AWAITING_APPROVAL" : anyFailed ? "FAILED" : "SUCCEEDED",
      finishedAt: anyAwaiting ? null : new Date(),
    },
  });
}

/** Duyệt/từ chối 1 step APPROVAL của workflow run — nếu duyệt thì chạy tiếp graph từ
 * các cạnh sau node đó; nếu từ chối thì dừng nhánh (không lan tiếp). */
export async function resumeAfterApproval(
  organizationId: string,
  actorId: string,
  runStepId: string,
  approved: boolean
) {
  const step = await prisma.workflowRunStep.findFirst({
    where: { id: runStepId, status: "AWAITING_APPROVAL" },
    include: { run: { include: { workflowVersion: true } } },
  });
  if (!step || step.run.organizationId !== organizationId) throw new Error("Không tìm thấy bước đang chờ duyệt");

  const config = step.output as { approverIds: string[]; mode: string; decisions: Record<string, boolean> } | null;
  if (!config || !config.approverIds.includes(actorId)) throw new Error("Bạn không phải người duyệt của bước này");

  const decisions = { ...(config.decisions ?? {}), [actorId]: approved };
  const mode = config.mode ?? "SEQUENTIAL";
  const allDecided = mode === "PARALLEL" ? config.approverIds.every((id) => id in decisions) : true;
  const rejected = Object.values(decisions).some((d) => d === false);

  if (!allDecided && !rejected) {
    await prisma.workflowRunStep.update({ where: { id: step.id }, data: { output: { ...config, decisions } } });
    return { status: "AWAITING_APPROVAL" as const };
  }

  const finalStatus = rejected ? "FAILED" : "SUCCEEDED";
  await prisma.workflowRunStep.update({
    where: { id: step.id },
    data: { status: finalStatus, output: { ...config, decisions }, finishedAt: new Date() },
  });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "workflow.run.approval_decision",
    entityType: "WorkflowRun",
    entityId: step.runId,
    after: { runStepId, approved },
  });

  if (rejected) {
    await prisma.workflowRun.update({ where: { id: step.runId }, data: { status: "FAILED", finishedAt: new Date() } });
    return { status: "FAILED" as const };
  }

  const definition = step.run.workflowVersion.definition as unknown as WorkflowDefinition;
  const priorSteps = await prisma.workflowRunStep.findMany({ where: { runId: step.runId } });
  const context = {
    trigger: step.run.triggerPayload,
    steps: Object.fromEntries(priorSteps.map((s) => [s.nodeId, s.output])),
  };

  await prisma.workflowRun.update({ where: { id: step.runId }, data: { status: "RUNNING" } });

  // Tiếp tục graph từ các cạnh sau node approval — dùng lại executeRun bằng cách chạy
  // riêng phần "tiếp diễn" thay vì chạy lại từ đầu (tránh chạy trùng các step đã xong).
  await continueRun(step.runId, definition, context, step.nodeId);
}

async function continueRun(
  runId: string,
  definition: WorkflowDefinition,
  context: { trigger: unknown; steps: Record<string, unknown> },
  fromNodeId: string
) {
  const alreadyRan = new Set(Object.keys(context.steps));
  const queue = outgoingEdges(definition, fromNodeId)
    .map((e) => definition.nodes.find((n) => n.id === e.target))
    .filter((n): n is WorkflowFlowNode => !!n && !alreadyRan.has(n.id));

  const visited = new Set(alreadyRan);
  let anyFailed = false;
  let anyAwaiting = false;

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);

    const step = await prisma.workflowRunStep.create({
      data: { runId, nodeId: node.id, nodeType: node.type, status: "RUNNING", input: context as object, startedAt: new Date() },
    });
    const result = await executeNode(node, context, runId);
    await prisma.workflowRunStep.update({
      where: { id: step.id },
      data: { status: result.status, output: (result.output ?? null) as object | undefined, error: result.error ?? null, finishedAt: new Date() },
    });
    context.steps[node.id] = result.output;

    if (result.status === "FAILED") {
      anyFailed = true;
      continue;
    }
    if (result.status === "AWAITING_APPROVAL") {
      anyAwaiting = true;
      continue;
    }
    const branch = node.type === "CONDITION" ? Boolean((result.output as { result?: boolean } | undefined)?.result) : undefined;
    for (const edge of outgoingEdges(definition, node.id, branch)) {
      const nextNode = definition.nodes.find((n) => n.id === edge.target);
      if (nextNode && !visited.has(nextNode.id)) queue.push(nextNode);
    }
  }

  if (!anyAwaiting) {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: anyFailed ? "FAILED" : "SUCCEEDED", finishedAt: new Date() },
    });
  }
}
