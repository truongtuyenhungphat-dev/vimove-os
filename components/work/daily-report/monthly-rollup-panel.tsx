"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { computeReportPercent, reportTone, dayOfMonth, weekdayShort, type ReportTone } from "@/lib/work/daily-report-types";
import type { MonthlyRollupRow } from "@/services/work/daily-reports";

const TONE_STYLE: Record<ReportTone, string> = {
  empty: "bg-muted text-muted-foreground",
  low: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  mid: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

function Cell({ done, total }: { done: number; total: number }) {
  const percent = computeReportPercent(done, total);
  const tone = reportTone(percent, total);
  return <div className={`flex h-8 w-12 items-center justify-center rounded text-xs font-medium ${TONE_STYLE[tone]}`}>{total === 0 ? "—" : `${percent}%`}</div>;
}

export function MonthlyRollupPanel({ workingDays, rows }: { workingDays: string[]; rows: MonthlyRollupRow[] }) {
  if (rows.length === 0) {
    return <EmptyState icon={Users} title="Chưa có dữ liệu" description="Chưa có nhân sự nào trong phạm vi xem của bạn." />;
  }

  const teamTotals = workingDays.map((date) => {
    let done = 0;
    let total = 0;
    for (const row of rows) {
      const cell = row.cells[date];
      if (cell) {
        done += cell.done;
        total += cell.total;
      }
    }
    return { done, total };
  });
  const teamGrandTotal = rows.reduce((s, r) => s + r.totalTasks, 0);
  const teamGrandDone = rows.reduce((s, r) => s + r.totalDone, 0);
  const teamGrandPostponed = rows.reduce((s, r) => s + r.totalPostponed, 0);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-40 bg-background">Nhân sự</TableHead>
            {workingDays.map((date) => (
              <TableHead key={date} className="w-14 text-center">
                <div>{dayOfMonth(date)}</div>
                <div className="text-[10px] font-normal text-muted-foreground">{weekdayShort(date)}</div>
              </TableHead>
            ))}
            <TableHead className="w-16 text-right">Tổng</TableHead>
            <TableHead className="w-16 text-right">Xong</TableHead>
            <TableHead className="w-16 text-right">Hoãn</TableHead>
            <TableHead className="w-16 text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.userId}>
              <TableCell className="sticky left-0 z-10 bg-background">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarImage src={row.avatarUrl ?? undefined} />
                    <AvatarFallback>{row.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{row.name}</p>
                    {row.title && <p className="text-xs text-muted-foreground">{row.title}</p>}
                  </div>
                </div>
              </TableCell>
              {workingDays.map((date) => {
                const cell = row.cells[date] ?? { done: 0, total: 0 };
                return (
                  <TableCell key={date} className="p-1 text-center">
                    <Cell done={cell.done} total={cell.total} />
                  </TableCell>
                );
              })}
              <TableCell className="text-right tabular-nums">{row.totalTasks}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.totalDone}</TableCell>
              <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">{row.totalPostponed}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{computeReportPercent(row.totalDone, row.totalTasks)}%</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/40 font-medium">
            <TableCell className="sticky left-0 z-10 bg-muted/40">TOÀN TEAM</TableCell>
            {teamTotals.map((t, i) => (
              <TableCell key={workingDays[i]} className="p-1 text-center">
                <Cell done={t.done} total={t.total} />
              </TableCell>
            ))}
            <TableCell className="text-right tabular-nums">{teamGrandTotal}</TableCell>
            <TableCell className="text-right tabular-nums">{teamGrandDone}</TableCell>
            <TableCell className="text-right tabular-nums">{teamGrandPostponed}</TableCell>
            <TableCell className="text-right tabular-nums">{computeReportPercent(teamGrandDone, teamGrandTotal)}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
