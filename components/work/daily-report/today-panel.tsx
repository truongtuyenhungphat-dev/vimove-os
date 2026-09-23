"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Loader2, ListChecks, Sparkles, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { DAILY_REPORT_ITEM_STATUSES, DAILY_REPORT_ITEM_STATUS_LABELS, type DailyReportItemStatus } from "@/lib/work/daily-report-types";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/work/types";

type ReportItem = {
  id: string;
  title: string;
  status: DailyReportItemStatus;
  priority: string;
  note: string | null;
  source: "FIXED" | "ADHOC";
};

type AssignedTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  dueAt: Date | null;
};

const STATUS_ITEMS = Object.fromEntries(DAILY_REPORT_ITEM_STATUSES.map((s) => [s, DAILY_REPORT_ITEM_STATUS_LABELS[s]]));

const STATUS_STYLE: Record<DailyReportItemStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  POSTPONED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function ItemRow({ item, canUpdate, updateAction }: { item: ReportItem; canUpdate: boolean; updateAction: (id: string, data: { status?: string; note?: string }) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(item.note ?? "");

  function saveStatus(status: string) {
    startTransition(async () => {
      try {
        await updateAction(item.id, { status });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function saveNote() {
    if (note === (item.note ?? "")) return;
    startTransition(async () => {
      try {
        await updateAction(item.id, { note });
        toast.success("Đã lưu ghi chú");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{item.title}</p>
          <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[item.status]}`}>
            {DAILY_REPORT_ITEM_STATUS_LABELS[item.status]}
          </Badge>
        </div>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="Ghi chú / vướng mắc..."
          disabled={!canUpdate}
          className="mt-1.5 h-7 border-none bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:bg-muted focus-visible:px-2"
        />
      </div>
      {canUpdate && (
        <Select items={STATUS_ITEMS} value={item.status} onValueChange={(v) => saveStatus(v as string)} disabled={isPending}>
          <SelectTrigger className="w-full sm:w-36">
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAILY_REPORT_ITEM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {DAILY_REPORT_ITEM_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function AddAdhocDialog({ addAction }: { addAction: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addAction(formData);
        toast.success("Đã thêm việc");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus /> Thêm việc
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Thêm việc phát sinh</DialogTitle>
          <DialogDescription>Việc không nằm trong checklist cố định hôm nay.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Input name="title" placeholder="Tên việc" required autoFocus />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Đang thêm..." : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TodayReportPanel({
  date,
  items,
  assignedTasks,
  canUpdate,
  addAction,
  updateAction,
}: {
  date: string;
  items: ReportItem[];
  assignedTasks: AssignedTask[];
  canUpdate: boolean;
  addAction: (formData: FormData) => Promise<void>;
  updateAction: (id: string, data: { status?: string; note?: string }) => Promise<void>;
}) {
  const fixedItems = items.filter((i) => i.source === "FIXED");
  const adhocItems = items.filter((i) => i.source === "ADHOC");
  const doneCount = items.filter((i) => i.status === "DONE").length + assignedTasks.filter((t) => t.status === "DONE").length;
  const totalCount = items.length + assignedTasks.length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">{date}</p>
            <p className="text-xs text-muted-foreground">Hoàn thành {doneCount}/{totalCount} việc hôm nay</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <ListChecks className="size-4 text-muted-foreground" /> Việc cố định
        </h3>
        {fixedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có mẫu việc cố định áp dụng cho vai trò của bạn.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {fixedItems.map((item) => (
              <ItemRow key={item.id} item={item} canUpdate={canUpdate} updateAction={updateAction} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-muted-foreground" /> Việc phát sinh
          </h3>
          {canUpdate && <AddAdhocDialog addAction={addAction} />}
        </div>
        {adhocItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có việc phát sinh nào hôm nay.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {adhocItems.map((item) => (
              <ItemRow key={item.id} item={item} canUpdate={canUpdate} updateAction={updateAction} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Send className="size-4 text-muted-foreground" /> Việc được giao
        </h3>
        {assignedTasks.length === 0 ? (
          <EmptyState icon={Send} title="Chưa có việc được giao hôm nay" description="Việc được giao qua Work Hub với hạn hôm nay sẽ hiện ở đây." />
        ) : (
          <div className="flex flex-col gap-2">
            {assignedTasks.map((t) => (
              <Link key={t.id} href={`/work/tasks/${t.id}`} className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50">
                <span className="font-medium">{t.title}</span>
                <Badge variant="outline" className="font-normal">
                  {TASK_STATUS_LABELS[t.status]}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
