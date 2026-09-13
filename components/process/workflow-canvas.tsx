"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  Zap,
  Play,
  GitBranch,
  ShieldCheck,
  Clock,
  Split,
  Globe,
  Sparkles,
  Save,
  Rocket,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  WORKFLOW_NODE_TYPES,
  WORKFLOW_NODE_LABELS,
  type WorkflowNodeType,
  type WorkflowDefinition,
  type WorkflowFlowNode,
  type WorkflowNodeConfig,
} from "@/lib/process/types";

const NODE_ICON: Record<WorkflowNodeType, typeof Zap> = {
  TRIGGER: Zap,
  ACTION: Play,
  CONDITION: GitBranch,
  APPROVAL: ShieldCheck,
  DELAY: Clock,
  PARALLEL: Split,
  WEBHOOK: Globe,
  AI: Sparkles,
};

const NODE_COLOR: Record<WorkflowNodeType, string> = {
  TRIGGER: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ACTION: "border-primary/40 bg-primary/10 text-primary",
  CONDITION: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  APPROVAL: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  DELAY: "border-border bg-muted text-muted-foreground",
  PARALLEL: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  WEBHOOK: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  AI: "border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300",
};

type NodeData = { label: string; nodeType: WorkflowNodeType; config: WorkflowNodeConfig };

function FlowNodeCard({ data, selected }: NodeProps & { data: NodeData }) {
  const Icon = NODE_ICON[data.nodeType];
  return (
    <div
      className={`flex min-w-40 items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm shadow-sm ${NODE_COLOR[data.nodeType]} ${selected ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
    >
      {data.nodeType !== "TRIGGER" && <Handle type="target" position={Position.Top} className="!size-2.5" />}
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-70">{WORKFLOW_NODE_LABELS[data.nodeType]}</span>
        <span className="font-medium">{data.label}</span>
      </div>
      {data.nodeType === "CONDITION" ? (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ left: "30%" }} className="!size-2.5 !bg-emerald-500" />
          <Handle type="source" position={Position.Bottom} id="false" style={{ left: "70%" }} className="!size-2.5 !bg-destructive" />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!size-2.5" />
      )}
    </div>
  );
}

const nodeTypes = { workflowNode: FlowNodeCard };

function toFlowNode(n: WorkflowFlowNode): Node<NodeData> {
  return { id: n.id, type: "workflowNode", position: n.position, data: { label: n.data.label, nodeType: n.type, config: n.data.config } };
}
function toFlowEdge(e: WorkflowDefinition["edges"][number]): Edge {
  return { id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? undefined, animated: true };
}

export function WorkflowCanvas({
  workflowId,
  initialDefinition,
  isPublished,
  isActive,
  users,
  onSaveDraft,
  onPublish,
  onRun,
}: {
  workflowId: string;
  initialDefinition: WorkflowDefinition;
  isPublished: boolean;
  isActive: boolean;
  users: { id: string; name: string }[];
  onSaveDraft: (workflowId: string, definition: WorkflowDefinition) => Promise<void>;
  onPublish: (workflowId: string) => Promise<void>;
  onRun: (workflowId: string) => Promise<string>;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner
        workflowId={workflowId}
        initialDefinition={initialDefinition}
        isPublished={isPublished}
        isActive={isActive}
        users={users}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onRun={onRun}
      />
    </ReactFlowProvider>
  );
}

function WorkflowCanvasInner({
  workflowId,
  initialDefinition,
  isPublished,
  isActive,
  users,
  onSaveDraft,
  onPublish,
  onRun,
}: {
  workflowId: string;
  initialDefinition: WorkflowDefinition;
  isPublished: boolean;
  isActive: boolean;
  users: { id: string; name: string }[];
  onSaveDraft: (workflowId: string, definition: WorkflowDefinition) => Promise<void>;
  onPublish: (workflowId: string) => Promise<void>;
  onRun: (workflowId: string) => Promise<string>;
}) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialDefinition.nodes.map(toFlowNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialDefinition.edges.map(toFlowEdge));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRunning, startRunTransition] = useTransition();

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);
  // Bộ đếm thuần thay Date.now()/crypto.randomUUID() để tránh vi phạm rule "purity" của
  // React Compiler (không gọi hàm impure trong thân component) — chỉ cần đủ unique giữa
  // các node cùng loại trong 1 phiên chỉnh sửa.
  const idCounterRef = useRef(0);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  function addNode(type: WorkflowNodeType) {
    idCounterRef.current += 1;
    const id = `${type.toLowerCase()}-${idCounterRef.current}`;
    const newNode: Node<NodeData> = {
      id,
      type: "workflowNode",
      position: { x: 80 + ((nodes.length * 60) % 400), y: 100 + Math.floor(nodes.length / 6) * 120 },
      data: { label: WORKFLOW_NODE_LABELS[type], nodeType: type, config: {} },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function removeSelected() {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }

  function updateSelectedNode(patch: Partial<NodeData>) {
    setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n)));
  }

  function toDefinition(): WorkflowDefinition {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as NodeData).nodeType,
        position: n.position,
        data: { label: (n.data as NodeData).label, config: (n.data as NodeData).config },
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    };
  }

  function handleSaveDraft() {
    startTransition(async () => {
      try {
        await onSaveDraft(workflowId, toDefinition());
        toast.success("Đã lưu nháp");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        await onSaveDraft(workflowId, toDefinition());
        await onPublish(workflowId);
        toast.success("Đã publish");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function handleRun() {
    startRunTransition(async () => {
      try {
        const runId = await onRun(workflowId);
        toast.success("Đã chạy — xem run log");
        router.push(`/process/runs/${runId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {WORKFLOW_NODE_TYPES.filter((t) => t !== "TRIGGER").map((type) => {
            const Icon = NODE_ICON[type];
            return (
              <Button key={type} type="button" variant="outline" size="sm" onClick={() => addNode(type)}>
                <Icon aria-hidden="true" /> {WORKFLOW_NODE_LABELS[type]}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          {isPublished && (
            <Badge variant="outline" className="border-transparent bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400">
              Đã publish
            </Badge>
          )}
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleSaveDraft}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            Lưu nháp
          </Button>
          {!isPublished && (
            <Button type="button" size="sm" disabled={isPending} onClick={handlePublish}>
              <Rocket aria-hidden="true" /> Publish
            </Button>
          )}
          {isActive && isPublished && (
            <Button type="button" size="sm" variant="outline" disabled={isRunning} onClick={handleRun}>
              {isRunning ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
              Chạy thử
            </Button>
          )}
        </div>
      </div>

      <div className="h-[520px] w-full overflow-hidden rounded-lg border border-border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <Sheet open={!!selectedNode} onOpenChange={(v) => !v && setSelectedId(null)}>
        <SheetContent>
          {selectedNode && (
            <NodeConfigForm
              node={selectedNode as Node<NodeData>}
              users={users}
              onChange={updateSelectedNode}
              onRemove={removeSelected}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NodeConfigForm({
  node,
  users,
  onChange,
  onRemove,
}: {
  node: Node<NodeData>;
  users: { id: string; name: string }[];
  onChange: (patch: Partial<NodeData>) => void;
  onRemove: () => void;
}) {
  const { nodeType, label, config } = node.data;

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Cấu hình node: {WORKFLOW_NODE_LABELS[nodeType]}</SheetTitle>
        <SheetDescription>Thay đổi áp dụng ngay vào canvas — nhớ bấm &quot;Lưu nháp&quot; để lưu lại.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="node-label">Nhãn hiển thị</Label>
          <Input id="node-label" value={label} onChange={(e) => onChange({ label: e.target.value })} />
        </div>

        {nodeType === "ACTION" && (
          <ActionConfigFields config={config} users={users} onChange={(c) => onChange({ config: c })} />
        )}
        {nodeType === "CONDITION" && (
          <ConditionConfigFields config={config} onChange={(c) => onChange({ config: c })} />
        )}
        {nodeType === "DELAY" && <DelayConfigFields config={config} onChange={(c) => onChange({ config: c })} />}
        {nodeType === "WEBHOOK" && <WebhookConfigFields config={config} onChange={(c) => onChange({ config: c })} />}
        {nodeType === "APPROVAL" && (
          <ApprovalConfigFields config={config} users={users} onChange={(c) => onChange({ config: c })} />
        )}
        {nodeType === "AI" && (
          <p className="text-sm text-muted-foreground">
            Node AI chưa nối Claude thật ở Phase 3 (cần <code>ANTHROPIC_API_KEY</code>, nối đầy đủ ở Phase 8 — AI
            Command Center). Chạy thử sẽ đánh dấu bước này là &quot;Bỏ qua&quot;.
          </p>
        )}
        {nodeType === "PARALLEL" && (
          <p className="text-sm text-muted-foreground">Node Parallel chỉ là điểm rẽ nhánh — nối nhiều cạnh ra từ node này để chạy song song.</p>
        )}
        {nodeType === "TRIGGER" && <p className="text-sm text-muted-foreground">Trigger thủ công — bấm &quot;Chạy thử&quot; để bắt đầu.</p>}
      </div>
      <SheetFooter>
        <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 aria-hidden="true" /> Xoá node
        </Button>
      </SheetFooter>
    </div>
  );
}

function ActionConfigFields({
  config,
  users,
  onChange,
}: {
  config: WorkflowNodeConfig;
  users: { id: string; name: string }[];
  onChange: (c: WorkflowNodeConfig) => void;
}) {
  const c = config as { actionKind?: string; userId?: string; message?: string };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Loại action</Label>
        <Select
          items={[
            { value: "notify", label: "Gửi thông báo cho 1 người" },
            { value: "audit_log", label: "Ghi log" },
          ]}
          value={c.actionKind ?? "notify"}
          onValueChange={(v) => onChange({ ...c, actionKind: v } as WorkflowNodeConfig)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="notify">Gửi thông báo cho 1 người</SelectItem>
            <SelectItem value="audit_log">Ghi log</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(c.actionKind ?? "notify") === "notify" && (
        <div className="flex flex-col gap-1.5">
          <Label>Người nhận</Label>
          <Select
            items={users.map((u) => ({ value: u.id, label: u.name }))}
            value={c.userId ?? ""}
            onValueChange={(v) => onChange({ ...c, userId: String(v) } as WorkflowNodeConfig)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn người..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label>Nội dung</Label>
        <Textarea value={c.message ?? ""} onChange={(e) => onChange({ ...c, message: e.target.value } as WorkflowNodeConfig)} />
      </div>
    </>
  );
}

function ConditionConfigFields({ config, onChange }: { config: WorkflowNodeConfig; onChange: (c: WorkflowNodeConfig) => void }) {
  const c = config as { field?: string; operator?: string; value?: string };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Field (dot-path, vd trigger.priority)</Label>
        <Input value={c.field ?? ""} onChange={(e) => onChange({ ...c, field: e.target.value } as WorkflowNodeConfig)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Toán tử</Label>
        <Select
          items={[
            { value: "eq", label: "Bằng" },
            { value: "neq", label: "Khác" },
            { value: "contains", label: "Chứa" },
            { value: "gt", label: "Lớn hơn" },
            { value: "lt", label: "Nhỏ hơn" },
          ]}
          value={c.operator ?? "eq"}
          onValueChange={(v) => onChange({ ...c, operator: v } as WorkflowNodeConfig)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eq">Bằng</SelectItem>
            <SelectItem value="neq">Khác</SelectItem>
            <SelectItem value="contains">Chứa</SelectItem>
            <SelectItem value="gt">Lớn hơn</SelectItem>
            <SelectItem value="lt">Nhỏ hơn</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Giá trị so sánh</Label>
        <Input value={c.value ?? ""} onChange={(e) => onChange({ ...c, value: e.target.value } as WorkflowNodeConfig)} />
      </div>
      <p className="text-xs text-muted-foreground">Nối cạnh từ 2 chấm dưới node: chấm xanh = Đúng, chấm đỏ = Sai.</p>
    </>
  );
}

function DelayConfigFields({ config, onChange }: { config: WorkflowNodeConfig; onChange: (c: WorkflowNodeConfig) => void }) {
  const c = config as { minutes?: number };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Số phút chờ</Label>
        <Input
          type="number"
          min={0}
          value={c.minutes ?? 0}
          onChange={(e) => onChange({ ...c, minutes: Number(e.target.value) } as WorkflowNodeConfig)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Giới hạn Phase 3: chưa có job queue durable nên delay không chờ thật — ghi nhận rồi chạy tiếp ngay.
      </p>
    </>
  );
}

function WebhookConfigFields({ config, onChange }: { config: WorkflowNodeConfig; onChange: (c: WorkflowNodeConfig) => void }) {
  const c = config as { url?: string; method?: "GET" | "POST"; retries?: number };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>URL</Label>
        <Input value={c.url ?? ""} onChange={(e) => onChange({ ...c, url: e.target.value } as WorkflowNodeConfig)} placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Method</Label>
        <Select
          items={[
            { value: "POST", label: "POST" },
            { value: "GET", label: "GET" },
          ]}
          value={c.method ?? "POST"}
          onValueChange={(v) => onChange({ ...c, method: v as "GET" | "POST" } as WorkflowNodeConfig)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Số lần thử lại khi lỗi</Label>
        <Input
          type="number"
          min={1}
          max={5}
          value={c.retries ?? 1}
          onChange={(e) => onChange({ ...c, retries: Number(e.target.value) } as WorkflowNodeConfig)}
        />
      </div>
      <p className="text-xs text-muted-foreground">Gọi HTTP thật khi chạy — body là context (trigger + output các bước trước).</p>
    </>
  );
}

function ApprovalConfigFields({
  config,
  users,
  onChange,
}: {
  config: WorkflowNodeConfig;
  users: { id: string; name: string }[];
  onChange: (c: WorkflowNodeConfig) => void;
}) {
  const c = config as { approverIds?: string[]; mode?: "SEQUENTIAL" | "PARALLEL" };
  const approverIds = c.approverIds ?? [];

  function toggle(id: string) {
    const next = approverIds.includes(id) ? approverIds.filter((x) => x !== id) : [...approverIds, id];
    onChange({ ...c, approverIds: next } as WorkflowNodeConfig);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Người duyệt</Label>
        <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border p-2">
          {users.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-accent">
              <Checkbox checked={approverIds.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
              {u.name}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Chế độ</Label>
        <Select
          items={[
            { value: "SEQUENTIAL", label: "Tuần tự" },
            { value: "PARALLEL", label: "Song song" },
          ]}
          value={c.mode ?? "SEQUENTIAL"}
          onValueChange={(v) => onChange({ ...c, mode: v as "SEQUENTIAL" | "PARALLEL" } as WorkflowNodeConfig)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEQUENTIAL">Tuần tự</SelectItem>
            <SelectItem value="PARALLEL">Song song</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Khi chạy tới đây, run sẽ tạm dừng (trạng thái &quot;Chờ duyệt&quot;) tới khi đủ người duyệt quyết định ở
        trang chi tiết lần chạy.
      </p>
    </>
  );
}
