"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationAction, type ActionState } from "./actions";

export function OrganizationSettingsForm({ name }: { name: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateOrganizationAction, undefined);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex max-w-sm flex-col gap-1.5">
        <Label htmlFor="org-name">Tên tổ chức</Label>
        <Input id="org-name" name="name" defaultValue={name} required />
      </div>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
