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
import { LANDING_PAGE_STATUSES, LANDING_PAGE_STATUS_LABELS, type LandingPageStatus } from "@/lib/marketing/types";

type Option = { id: string; name: string };

export type LandingPageFormData = {
  id: string;
  name: string;
  slug: string;
  status: LandingPageStatus;
  campaignId: string | null;
  headline: string;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export function LandingPageDialog({
  mode,
  page,
  campaigns,
  action,
}: {
  mode: "create" | "edit";
  page?: LandingPageFormData;
  campaigns: Option[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<LandingPageStatus>(page?.status ?? "DRAFT");
  const campaignItems = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));

  function handleSubmit(formData: FormData) {
    if (mode === "edit") formData.set("status", status);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success(mode === "create" ? "Đã tạo landing page" : "Đã cập nhật landing page");
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
        if (v) setStatus(page?.status ?? "DRAFT");
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus /> Tạo landing page
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Sửa "${page?.name}"`} />}>
          <Pencil className="size-4" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tạo landing page" : "Sửa landing page"}</DialogTitle>
          <DialogDescription>Trang công khai thật tại /lp/&#123;slug&#125; — form thu lead hoạt động ngay.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-name">Tên nội bộ</Label>
              <Input id="lp-name" name="name" defaultValue={page?.name} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-slug">Slug (URL)</Label>
              <Input id="lp-slug" name="slug" placeholder="uu-dai-q4" defaultValue={page?.slug} required disabled={mode === "edit"} pattern="[a-z0-9-]+" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lp-headline">Tiêu đề chính</Label>
            <Input id="lp-headline" name="headline" defaultValue={page?.headline} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lp-body">Nội dung</Label>
            <Textarea id="lp-body" name="body" defaultValue={page?.body ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-cta-label">Nhãn nút CTA</Label>
              <Input id="lp-cta-label" name="ctaLabel" placeholder="Nhận ưu đãi ngay" defaultValue={page?.ctaLabel ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-cta-url">Link CTA (tuỳ chọn)</Label>
              <Input id="lp-cta-url" name="ctaUrl" placeholder="https://..." defaultValue={page?.ctaUrl ?? ""} />
            </div>
          </div>
          {campaigns.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-campaign">Chiến dịch</Label>
              <Select items={campaignItems} name="campaignId" defaultValue={page?.campaignId ?? undefined}>
                <SelectTrigger id="lp-campaign" className="w-full">
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
          {mode === "edit" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lp-status">Trạng thái</Label>
              <Select items={LANDING_PAGE_STATUS_LABELS} value={status} onValueChange={(v) => setStatus(v as LandingPageStatus)}>
                <SelectTrigger id="lp-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANDING_PAGE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LANDING_PAGE_STATUS_LABELS[s]}
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
