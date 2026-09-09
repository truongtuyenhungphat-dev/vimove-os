"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormFieldDef } from "@/services/marketing/landing-pages";

/** Form thu lead render THẬT ở trang công khai /lp/[slug] — submit tạo FormSubmission
 * thật trong DB (không giả lập), không cần đăng nhập. */
export function PublicLeadForm({
  formId,
  fields,
  ctaLabel,
  onSubmit,
}: {
  formId: string;
  fields: FormFieldDef[];
  ctaLabel: string;
  onSubmit: (formId: string, data: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(formId, values);
        setSubmitted(true);
      } catch {
        setError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <p className="font-medium">Cảm ơn bạn đã đăng ký!</p>
        <p className="text-sm text-muted-foreground">Đội ngũ VIMOVE sẽ liên hệ lại sớm nhất.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <Label htmlFor={`lp-field-${f.key}`}>{f.label}{f.required && " *"}</Label>
          {f.type === "textarea" ? (
            <Textarea
              id={`lp-field-${f.key}`}
              required={f.required}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          ) : (
            <Input
              id={`lp-field-${f.key}`}
              type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
              required={f.required}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="mt-1">
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isPending ? "Đang gửi..." : ctaLabel}
      </Button>
    </form>
  );
}
