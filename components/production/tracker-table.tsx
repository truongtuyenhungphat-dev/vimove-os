"use client";

import { Fragment, useState, useTransition } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";
import { PRODUCTION_TASK_TYPES, WEEKDAY_SHORT, fmtShort, parseDateKey } from "@/lib/production/types";
import { cn } from "@/lib/utils";

type Channel = { id: string; name: string; taskTypes: string[] };
type Creator = { id: string; user: { id: string; name: string } };
type Entry = { date: string; userId: string; channelId: string; counts: Record<string, number> };

const TINT_CLASSES = [
  "bg-blue-50 dark:bg-blue-950/40",
  "bg-violet-50 dark:bg-violet-950/40",
  "bg-amber-50 dark:bg-amber-950/40",
  "bg-emerald-50 dark:bg-emerald-950/40",
  "bg-rose-50 dark:bg-rose-950/40",
  "bg-cyan-50 dark:bg-cyan-950/40",
];

export function TrackerTable({
  channels,
  creators,
  entries,
  weekDates,
  todayKey,
  canUpdate,
  canManage,
  updateCountAction,
}: {
  channels: Channel[];
  creators: Creator[];
  entries: Entry[];
  weekDates: string[];
  todayKey: string;
  canUpdate: boolean;
  canManage: boolean;
  updateCountAction: (date: string, userId: string, channelId: string, taskType: string, value: number) => Promise<void>;
}) {
  const lookup = new Map<string, Record<string, number>>();
  for (const e of entries) lookup.set(`${e.date}__${e.userId}__${e.channelId}`, e.counts);

  function cellValue(date: string, userId: string, channelId: string, task: string) {
    return lookup.get(`${date}__${userId}__${channelId}`)?.[task] ?? 0;
  }
  function channelDayTotal(date: string, channelId: string, task: string) {
    return creators.reduce((sum, c) => sum + cellValue(date, c.user.id, channelId, task), 0);
  }
  function grandDayTotal(date: string, task: string) {
    return channels.reduce((sum, c) => (c.taskTypes.includes(task) ? sum + channelDayTotal(date, c.id, task) : sum), 0);
  }
  function grandRangeTotal(task: string) {
    return weekDates.reduce((sum, d) => sum + grandDayTotal(d, task), 0);
  }

  if (creators.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Chưa có thành viên nào trong đội content"
        description={canManage ? 'Dùng nút "Quản lý thành viên" ở trên để thêm người đầu tiên.' : "Liên hệ quản trị viên để được thêm vào đội."}
      />
    );
  }
  if (channels.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Chưa có kênh nội dung nào"
        description={canManage ? 'Dùng nút "Quản lý kênh" ở trên để thêm kênh đầu tiên.' : "Liên hệ quản trị viên để thêm kênh."}
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead rowSpan={2} className="sticky left-0 z-10 bg-background align-bottom">
              Ngày / Thành viên
            </TableHead>
            <TableHead colSpan={PRODUCTION_TASK_TYPES.length} className="bg-primary/10 text-center text-primary">
              Tổng
            </TableHead>
            {channels.map((c, i) => (
              <TableHead key={c.id} colSpan={c.taskTypes.length} className={cn("text-center", TINT_CLASSES[i % TINT_CLASSES.length])}>
                {c.name}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {PRODUCTION_TASK_TYPES.map((t) => (
              <TableHead key={t} className="bg-primary/10 text-center text-xs text-primary">
                {t}
              </TableHead>
            ))}
            {channels.map((c, i) =>
              c.taskTypes.map((t) => (
                <TableHead key={`${c.id}-${t}`} className={cn("text-center text-xs", TINT_CLASSES[i % TINT_CLASSES.length])}>
                  {t}
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-accent font-semibold hover:bg-accent">
            <TableCell className="sticky left-0 z-10 bg-accent">Tổng cả tuần</TableCell>
            {PRODUCTION_TASK_TYPES.map((t) => (
              <TableCell key={t} className="text-center">
                {fmtDash(grandRangeTotal(t))}
              </TableCell>
            ))}
            {channels.map((c) =>
              c.taskTypes.map((t) => {
                const sum = weekDates.reduce((s, d) => s + channelDayTotal(d, c.id, t), 0);
                return (
                  <TableCell key={`${c.id}-${t}`} className="text-center">
                    {fmtDash(sum)}
                  </TableCell>
                );
              })
            )}
          </TableRow>

          {weekDates.map((date) => {
            const d = parseDateKey(date);
            const isToday = date === todayKey;
            return (
              <Fragment key={date}>
                <TableRow className={cn("font-semibold", isToday ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted/60")}>
                  <TableCell className={cn("sticky left-0 z-10", isToday ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted/60")}>
                    {WEEKDAY_SHORT[d.getDay()]}, {fmtShort(d)}
                  </TableCell>
                  {PRODUCTION_TASK_TYPES.map((t) => (
                    <TableCell key={t} className="text-center">
                      {fmtDash(grandDayTotal(date, t))}
                    </TableCell>
                  ))}
                  {channels.map((c) =>
                    c.taskTypes.map((t) => (
                      <TableCell key={`${c.id}-${t}`} className="text-center">
                        {fmtDash(channelDayTotal(date, c.id, t))}
                      </TableCell>
                    ))
                  )}
                </TableRow>
                {creators.map((creator) => (
                  <TableRow key={`${date}-${creator.id}`} className={isToday ? "bg-amber-50/50 dark:bg-amber-950/10" : undefined}>
                    <TableCell className={cn("sticky left-0 z-10 bg-background", isToday && "bg-amber-50/50 dark:bg-amber-950/10")}>
                      {creator.user.name}
                    </TableCell>
                    {PRODUCTION_TASK_TYPES.map((t) => {
                      const v = channels.reduce((s, c) => (c.taskTypes.includes(t) ? s + cellValue(date, creator.user.id, c.id, t) : s), 0);
                      return (
                        <TableCell key={t} className="text-center text-muted-foreground">
                          {fmtDash(v)}
                        </TableCell>
                      );
                    })}
                    {channels.map((c) =>
                      c.taskTypes.map((t) => (
                        <EditableCell
                          key={`${c.id}-${t}`}
                          value={cellValue(date, creator.user.id, c.id, t)}
                          disabled={!canUpdate}
                          onCommit={(value) => updateCountAction(date, creator.user.id, c.id, t, value)}
                        />
                      ))
                    )}
                  </TableRow>
                ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function fmtDash(n: number) {
  return n > 0 ? n : "–";
}

function EditableCell({ value, disabled, onCommit }: { value: number; disabled: boolean; onCommit: (value: number) => Promise<void> }) {
  const [local, setLocal] = useState(value > 0 ? String(value) : "");
  const [isPending, startTransition] = useTransition();

  function commit() {
    const n = Math.max(0, Math.floor(Number(local)) || 0);
    if (n === value) return;
    startTransition(async () => {
      try {
        await onCommit(n);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không lưu được");
        setLocal(value > 0 ? String(value) : "");
      }
    });
  }

  return (
    <TableCell className="p-0.5 text-center">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={local}
        disabled={disabled || isPending}
        placeholder="–"
        className="h-8 w-11 rounded-md border border-transparent bg-transparent text-center text-sm tabular-nums hover:border-border focus:border-primary focus:bg-background focus:outline-none disabled:opacity-70"
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </TableCell>
  );
}
