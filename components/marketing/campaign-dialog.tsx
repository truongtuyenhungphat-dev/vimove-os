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
import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_LABELS, type CampaignStatus } from "@/lib/marketing/types";

type Option = { id: string; name: string };

export type CampaignFormData = {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  projectId: string | null;
  budget: number | null;
  startAt: string | null;
  endAt: string | null;
};

export function CampaignDialog({
  mode,
  campaign,
  projects,
  action,
}: {
  mode: "create" | "edit";
  campaign?: CampaignFormData;
  projects: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? "DRAFT");
  const projectItems = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  function handleSubmit(formData: FormData) {
    if (mode === "edit") formData.set("status", status);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo chiến dịch" : "Đã cập nhật chiến dịch");
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
        if (v) setStatus(campaign?.status ?? "DRAFT");
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo chiến dịch
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${campaign?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo chiến dịch" : "Sửa chiến dịch"}</DialogTitle>
          <DialogDescription>Chiến dịch có thể gắn với 1 dự án để theo dõi công việc liên quan.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaign-name">Tên chiến dịch</Label>
            <Input id="campaign-name" name="name" defaultValue={campaign?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaign-description">Mô tả</Label>
            <Textarea id="campaign-description" name="description" defaultValue={campaign?.description ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-project">Dự án liên kết</Label>
              <Select items={projectItems} name="projectId" defaultValue={campaign?.projectId ?? undefined}>
                <SelectTrigger id="campaign-project" className="w-full">
                  <SelectValue placeholder="Không thuộc dự án nào" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-budget">Ngân sách (VNĐ)</Label>
              <Input id="campaign-budget" name="budget" type="number" min={0} step={100000} defaultValue={campaign?.budget ?? ""} />
            </div>
          </div>
          {mode === "edit" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-status">Trạng thái</Label>
              <Select items={CAMPAIGN_STATUS_LABELS} value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
                <SelectTrigger id="campaign-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CAMPAIGN_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-start">Bắt đầu</Label>
              <Input id="campaign-start" name="startAt" type="date" defaultValue={campaign?.startAt ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-end">Kết thúc</Label>
              <Input id="campaign-end" name="endAt" type="date" defaultValue={campaign?.endAt ?? ""} />
            </div>
          </div>
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
