"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";
import type { PermissionKey } from "@/lib/permissions/catalog";

export function AppSidebar({ permissions }: { permissions: PermissionKey[] }) {
  const pathname = usePathname();
  const permissionSet = new Set(permissions);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 px-5">
        <span className="text-lg font-semibold tracking-tight">
          VIMOVE <span className="text-sidebar-primary">OS</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.permission || permissionSet.has(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-4">
              <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
