import { ShieldAlert } from "lucide-react";

export function PermissionDenied({ permission }: { permission?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="size-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium">Bạn không có quyền truy cập mục này</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {permission ? `Cần quyền "${permission}".` : "Liên hệ Quản trị viên nếu cần được cấp quyền."}
        </p>
      </div>
    </div>
  );
}
