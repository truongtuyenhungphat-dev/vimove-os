"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/work/types";

/** Filter bar dùng chung cho All Tasks/Kanban/Calendar/Timeline/Gantt — đọc/ghi qua query
 * string, page (Server Component) đọc lại qua `searchParams` để lọc dữ liệu thật. */
export function TaskFilters({
  assignees,
  tags,
}: {
  assignees: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Tìm công việc..."
        defaultValue={searchParams.get("search") ?? ""}
        className="h-8 w-48"
        onChange={(e) => setParam("search", e.target.value || undefined)}
      />
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => setParam("status", v === "all" ? undefined : String(v))}
      >
        <SelectTrigger className="h-8 w-36">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(v) => setParam("priority", v === "all" ? undefined : String(v))}
      >
        <SelectTrigger className="h-8 w-36">
          <SelectValue placeholder="Độ ưu tiên" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {TASK_PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("assigneeId") ?? "all"}
        onValueChange={(v) => setParam("assigneeId", v === "all" ? undefined : String(v))}
      >
        <SelectTrigger className="h-8 w-40">
          <SelectValue placeholder="Người phụ trách" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả người phụ trách</SelectItem>
          {assignees.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {tags.length > 0 && (
        <Select
          value={searchParams.get("tagId") ?? "all"}
          onValueChange={(v) => setParam("tagId", v === "all" ? undefined : String(v))}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue placeholder="Nhãn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhãn</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
