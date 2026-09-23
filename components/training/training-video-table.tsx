"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GraduationCap, Search, PlayCircle, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import { EditTrainingVideoDialog } from "./edit-training-video-dialog";
import type { listTrainingVideos } from "@/services/training/videos";

export type TrainingVideoRow = Awaited<ReturnType<typeof listTrainingVideos>>[number];

const ALL_CATEGORIES = "__all__";

function fmtDate(date: Date | string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

export function TrainingVideoTable({
  videos,
  categories,
  canUpdate,
  canDelete,
  updateAction,
  deleteAction,
}: {
  videos: TrainingVideoRow[];
  categories: string[];
  canUpdate: boolean;
  canDelete: boolean;
  updateAction: (id: string, data: { category: string; title: string; publishedDate?: string; youtubeUrl: string; mbsUrl?: string }) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [editTarget, setEditTarget] = useState<TrainingVideoRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingVideoRow | null>(null);
  const [isPending, setIsPending] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (category !== ALL_CATEGORIES && v.category !== category) return false;
      if (q && !v.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [videos, search, category]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsPending(true);
    try {
      await deleteAction(deleteTarget.id);
      toast.success("Đã xoá video");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm theo tên video..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select items={{ [ALL_CATEGORIES]: "Tất cả danh mục", ...Object.fromEntries(categories.map((c) => [c, c])) }} value={category} onValueChange={(v) => setCategory(v as string)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Tất cả danh mục</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto">{filtered.length} video</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Không có video nào" description="Thử đổi từ khoá tìm kiếm hoặc danh mục." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead className="hidden sm:table-cell">Danh mục</TableHead>
                <TableHead>Video</TableHead>
                <TableHead className="hidden text-right md:table-cell">Ngày đăng</TableHead>
                <TableHead className="text-right">Link</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-muted-foreground tabular-nums">{v.order}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="font-normal">
                      {v.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{v.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                      {v.category} · {fmtDate(v.publishedDate)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-right text-sm text-muted-foreground md:table-cell">{fmtDate(v.publishedDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Xem YouTube" nativeButton={false} render={<Link href={v.youtubeUrl} target="_blank" />}>
                        <PlayCircle className="size-4 text-red-600 dark:text-red-400" />
                      </Button>
                      {v.mbsUrl && (
                        <Button variant="ghost" size="icon-sm" aria-label="Xem bài trên MBS" nativeButton={false} render={<Link href={v.mbsUrl} target="_blank" />}>
                          <ExternalLink className="size-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${v.title}`} />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => setEditTarget(v)}>
                              <Pencil className="size-4" /> Sửa
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(v)}>
                              <Trash2 className="size-4" /> Xoá
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editTarget && canUpdate && (
        <EditTrainingVideoDialog
          video={editTarget}
          categories={categories}
          open
          onOpenChange={(open) => !open && setEditTarget(null)}
          updateAction={updateAction}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá video đào tạo</AlertDialogTitle>
            <AlertDialogDescription>Xoá &quot;{deleteTarget?.title}&quot; khỏi danh sách — không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={confirmDelete}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
