"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Ban, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserStatus } from "@/app/generated/prisma/enums";
import { setUserStatusAction } from "./actions";

export function UserStatusToggle({ userId, status }: { userId: string; status: UserStatus }) {
  const [isPending, startTransition] = useTransition();
  const isActive = status === "ACTIVE";

  function handleClick() {
    startTransition(async () => {
      try {
        await setUserStatusAction(userId, isActive ? "INACTIVE" : "ACTIVE");
        toast.success(isActive ? "Đã vô hiệu hoá người dùng" : "Đã kích hoạt lại người dùng");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={handleClick}
      className={isActive ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"}
      title={isActive ? "Vô hiệu hoá" : "Kích hoạt lại"}
      aria-label={isActive ? "Vô hiệu hoá" : "Kích hoạt lại"}
    >
      {isActive ? <Ban className="size-4" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}
    </Button>
  );
}
