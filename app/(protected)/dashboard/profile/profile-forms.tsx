"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, changePasswordAction, type ActionState } from "./actions";

function useActionToast(state: ActionState) {
  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);
}

export function ProfileInfoForm({ name, title }: { name: string; title: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateProfileAction, undefined);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Họ tên</Label>
          <Input id="name" name="name" defaultValue={name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Chức danh</Label>
          <Input id="title" name="title" defaultValue={title} placeholder="VD: Marketing Manager" />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isPending ? "Đang lưu..." : "Lưu thông tin"}
        </Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(changePasswordAction, undefined);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-4" key={state?.success ? "reset" : "form"}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
        </div>
      </div>
      <div>
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isPending ? "Đang đổi..." : "Đổi mật khẩu"}
        </Button>
      </div>
    </form>
  );
}
