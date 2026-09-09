"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTENT_TYPES, CONTENT_TYPE_LABELS, type ContentType } from "@/lib/marketing/types";

type Option = { id: string; name: string };

export type ContentFormData = {
  id: string;
  title: string;
  type: ContentType;
  campaignId: string | null;
  assigneeId: string | null;
  body: string | null;
};

export function ContentDialog({
  mode,
  content,
  campaigns,
  assignees,
  action,
}: {
  mode: "create" | "edit";
  content?: ContentFormData;
  campaigns: Option[];
  assignees: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ContentType>(content?.type ?? "ARTICLE");
  const campaignItems = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));
  const assigneeItems = Object.fromEntries(assignees.map((a) => [a.id, a.name]));

  function handleSubmit(formData: FormData) {
    formData.set("type", type);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo nội dung" : "Đã cập nhật nội dung");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setType(content?.type ?? "ARTICLE");
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo nội dung
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${content?.title}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo nội dung" : "Sửa nội dung"}</DialogTitle>
          <DialogDescription>Nội dung đi qua các giai đoạn Idea→Brief→Script→Production→Review→Approved→Scheduled→Published.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content-title">Tiêu đề</Label>
            <Input id="content-title" name="title" defaultValue={content?.title} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content-body">Brief / Mô tả</Label>
            <Textarea id="content-body" name="body" defaultValue={content?.body ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-type">Loại nội dung</Label>
              <Select items={CONTENT_TYPE_LABELS} value={type} onValueChange={(v) => setType(v as ContentType)}>
                <SelectTrigger id="content-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CONTENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-assignee">Người phụ trách</Label>
              <Select items={assigneeItems} name="assigneeId" defaultValue={content?.assigneeId ?? undefined}>
                <SelectTrigger id="content-assignee" className="w-full">
                  <SelectValue placeholder="Chưa gán" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {campaigns.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content-campaign">Chiến dịch</Label>
              <Select items={campaignItems} name="campaignId" defaultValue={content?.campaignId ?? undefined}>
                <SelectTrigger id="content-campaign" className="w-full">
                  <SelectValue placeholder="Không thuộc chiến dịch nào" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
