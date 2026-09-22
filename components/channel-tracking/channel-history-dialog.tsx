"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkline } from "./sparkline";
import { fmtNumber } from "@/lib/channel-tracking/types";
import { getChannelHistoryAction } from "@/app/(protected)/marketing/channel-tracking/actions";
import type { ChannelRow } from "@/services/channel-tracking/channels";

type HistorySnapshot = { date: string; followers: number | null; totalViews: number | null; videosCount: number | null; engagement: number | null; scrapeStatus: string };

export function ChannelHistoryDialog({ channel, open, onOpenChange }: { channel: ChannelRow; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [snapshots, setSnapshots] = useState<HistorySnapshot[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getChannelHistoryAction(channel.id, 30).then((r) => {
      if (!cancelled) setSnapshots(r.snapshots);
    });
    return () => {
      cancelled = true;
    };
  }, [open, channel.id]);

  const series = (snapshots ?? [])
    .filter((s) => s.followers != null)
    .slice()
    .reverse()
    .map((s) => s.followers as number);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lịch sử @{channel.username}</DialogTitle>
          <DialogDescription>30 ngày gần nhất</DialogDescription>
        </DialogHeader>

        {snapshots === null ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : snapshots.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Chưa có dữ liệu quét cho kênh này.</p>
        ) : (
          <>
            <div className="flex justify-center py-2">
              <Sparkline points={series} width={280} height={48} />
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Follower</TableHead>
                    <TableHead className="text-right">View</TableHead>
                    <TableHead className="text-right">Video</TableHead>
                    <TableHead className="text-right">Tương tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => (
                    <TableRow key={s.date}>
                      <TableCell className="text-muted-foreground">
                        {s.date}
                        {s.scrapeStatus === "failed" && <span className="ml-1.5 text-xs text-destructive">(lỗi)</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(s.followers)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(s.totalViews)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(s.videosCount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(s.engagement)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
