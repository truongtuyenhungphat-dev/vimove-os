import Link from "next/link";
import { Bell, LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PermissionKey } from "@/lib/permissions/catalog";
import { AppBreadcrumb } from "./app-breadcrumb";
import { ThemeToggle } from "./theme-toggle";
import { signOutAction } from "./actions";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppTopbar({
  userName,
  userEmail,
  unreadNotifications,
  permissions,
}: {
  userName: string;
  userEmail: string;
  unreadNotifications: number;
  permissions: PermissionKey[];
}) {
  const canManageOrganization = permissions.includes("organization.manage");
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <AppBreadcrumb />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          nativeButton={false}
          render={<Link href="/dashboard/notifications" aria-label="Thông báo" />}
        >
          <Bell className="size-4.5" />
          {unreadNotifications > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-1.5" />}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials(userName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
                <UserRound /> Hồ sơ cá nhân
              </DropdownMenuItem>
              {canManageOrganization && (
                <DropdownMenuItem render={<Link href="/admin/settings" />}>
                  <Settings /> Cài đặt tổ chức
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOutAction} className="contents">
              <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
                <LogOut /> Đăng xuất
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
