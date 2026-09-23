"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, History, Pencil, Pause, Play, Trash2, ArrowUpRight, Users2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkline } from "./sparkline";
import { EditChannelDialog } from "./edit-channel-dialog";
import { ChannelHistoryDialog } from "./channel-history-dialog";
import {
  PLATFORM_LABEL,
  TRACKED_CHANNEL_STATUS_LABELS,
  fmtNumber,
  isLikesProxyMetric,
  isPartialVideoMetric,
  type Platform,
  type TrackedChannelStatus,
} from "@/lib/channel-tracking/types";
import type { ChannelRow } from "@/services/channel-tracking/channels";

const STATUS_STYLE: Record<TrackedChannelStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PAUSED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REMOVED: "bg-muted text-muted-foreground",
};

const PLATFORM_STYLE: Record<Platform, string> = {
  TIKTOK: "bg-foreground/10 text-foreground",
  YOUTUBE: "bg-red-500/10 text-red-600 dark:text-red-400",
  FACEBOOK: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  INSTAGRAM: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
};

function DeltaText({ label, value, span }: { label: string; value: number | null; span?: number | null }) {
  const cls =
    value == null || value === 0
      ? "text-muted-foreground"
      : value > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="w-6 shrink-0 text-muted-foreground">{label}</span>
      <span className={cls}>
        {value == null ? "—" : `${value > 0 ? "+" : ""}${fmtNumber(value)}`}
        {span != null && span !== 7 && <span className="text-muted-foreground"> /{span}d</span>}
      </span>
    </div>
  );
}

export function ChannelTable({
  channels,
  canUpdate,
  canDelete,
  updateAction,
  deleteAction,
}: {
  channels: ChannelRow[];
  canUpdate: boolean;
  canDelete: boolean;
  updateAction: (id: string, data: { label?: string; status?: string; url?: string }) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [editTarget, setEditTarget] = useState<ChannelRow | null>(null);
  const [historyTarget, setHistoryTarget] = useState<ChannelRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      try {
        await deleteAction(id);
        toast.success("Đã gỡ khỏi danh sách theo dõi");
        setDeleteTarget(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  if (channels.length === 0) {
    return <EmptyState icon={Users2} title="Chưa có kênh nào" description="Bấm “Thêm kênh” để bắt đầu theo dõi." />;
  }

  function toggleStatus(ch: ChannelRow) {
    const next = ch.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    startTransition(async () => {
      try {
        await updateAction(ch.id, { status: next });
        toast.success(next === "ACTIVE" ? "Đã mở lại theo dõi" : "Đã tạm dừng theo dõi");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kênh</TableHead>
              <TableHead className="hidden sm:table-cell">Trạng thái</TableHead>
              <TableHead className="text-right">Follower</TableHead>
              <TableHead className="hidden text-right md:table-cell">View / Thích*</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Video</TableHead>
              <TableHead className="hidden lg:table-cell">Tăng trưởng (7 ngày)</TableHead>
              <TableHead className="hidden xl:table-cell">Xu hướng</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarImage src={c.avatarUrl ?? undefined} />
                      <AvatarFallback>{c.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`border-transparent font-normal ${PLATFORM_STYLE[c.platform as Platform]}`}>
                          {PLATFORM_LABEL[c.platform as Platform]}
                        </Badge>
                        {!c.scannedToday && c.status === "ACTIVE" && (
                          <span className="size-1.5 rounded-full bg-amber-500" title="Chưa quét được hôm nay" />
                        )}
                      </div>
                      <Link href={c.url} target="_blank" className="flex items-center gap-1 text-sm font-medium hover:underline">
                        @{c.username}
                        <ArrowUpRight className="size-3 text-muted-foreground" />
                      </Link>
                      {c.label && <p className="text-xs text-muted-foreground">{c.label}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[c.status as TrackedChannelStatus]}`}>
                    {TRACKED_CHANNEL_STATUS_LABELS[c.status as TrackedChannelStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <p className="font-medium tabular-nums">{fmtNumber(c.followers)}</p>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                  {fmtNumber(c.totalViews)}
                  {isLikesProxyMetric(c.platform as Platform) && <span className="ml-1 text-[10px]">❤</span>}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                  {fmtNumber(c.videosCount)}
                  {isPartialVideoMetric(c.platform as Platform) && <span className="ml-1 text-[10px]">†</span>}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <DeltaText label="Follo" value={c.followersDelta7d} span={c.followersDelta7dSpan} />
                    <DeltaText label={isLikesProxyMetric(c.platform as Platform) ? "Thích" : "View"} value={c.viewsDelta7d} />
                    <DeltaText label="T.tác" value={c.engagementDelta7d} />
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Sparkline points={c.followersSeries} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác với @${c.username}`} />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setHistoryTarget(c)}>
                        <History className="size-4" /> Lịch sử 30 ngày
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => setEditTarget(c)}>
                          <Pencil className="size-4" /> Sửa link / ghi chú
                        </DropdownMenuItem>
                      )}
                      {canUpdate && c.status !== "REMOVED" && (
                        <DropdownMenuItem onClick={() => toggleStatus(c)}>
                          {c.status === "ACTIVE" ? (
                            <>
                              <Pause className="size-4" /> Tạm dừng
                            </>
                          ) : (
                            <>
                              <Play className="size-4" /> Mở lại
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {canDelete && c.status !== "REMOVED" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(c)}>
                            <Trash2 className="size-4" /> Gỡ khỏi danh sách
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {channels.some((c) => isLikesProxyMetric(c.platform as Platform)) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          * TikTok không công khai API trả tổng view trọn đời — cột này với kênh TikTok (❤) là tổng lượt thích cộng dồn, không phải view.
        </p>
      )}
      {channels.some((c) => isPartialVideoMetric(c.platform as Platform)) && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          † Facebook không công khai API trả tổng số video trọn đời của trang — cột Video (†) là số video cộng dồn từ các lần quét, có thể thấp hơn tổng thật.
        </p>
      )}

      {editTarget && canUpdate && (
        <EditChannelDialog channel={editTarget} open onOpenChange={(open) => !open && setEditTarget(null)} updateAction={updateAction} />
      )}
      {historyTarget && (
        <ChannelHistoryDialog key={historyTarget.id} channel={historyTarget} open onOpenChange={(open) => !open && setHistoryTarget(null)} />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ khỏi danh sách theo dõi</AlertDialogTitle>
            <AlertDialogDescription>
              Gỡ &quot;@{deleteTarget?.username}&quot; — lịch sử số liệu vẫn được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={confirmDelete}>
              Gỡ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
