"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";
import type { PermissionKey } from "@/lib/permissions/catalog";

// Nhiều section (10 nhóm, ~40 mục cho SUPER_ADMIN) khiến sidebar dài phải cuộn liên
// tục — thu gọn theo nhóm để chỉ hiện đúng nhóm đang dùng, đỡ rối. Mặc định: nhóm
// chứa trang đang mở luôn hiện; các nhóm khác thu gọn cho tới khi người dùng tự bấm
// mở (lưu lại lựa chọn ở localStorage, riêng theo trình duyệt — không phải dữ liệu
// nghiệp vụ nên không cần lưu server). Nhóm chỉ có 1 mục (vd "Tổng quan") không có gì
// để thu gọn nên luôn hiện thẳng, không cần nút bấm.
//
// Đọc/ghi qua useSyncExternalStore (module-level cache + listener) thay vì
// effect+setState — cùng lý do đã ghi ở theme-toggle.tsx: tránh vi phạm rule
// "set-state-in-effect" và tránh hydration mismatch (server không có localStorage).
const STORAGE_KEY = "vimove-os:sidebar-open-sections";
type SectionOverrides = Record<string, boolean>;

let cachedOverrides: SectionOverrides | null = null;
const listeners = new Set<() => void>();

function readOverrides(): SectionOverrides {
  if (cachedOverrides) return cachedOverrides;
  let parsed: SectionOverrides = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  cachedOverrides = parsed;
  return parsed;
}

function writeOverrides(next: SectionOverrides) {
  cachedOverrides = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Không lưu được (chế độ ẩn danh...) thì thôi — vẫn thu/mở đúng cho phiên hiện tại.
  }
  listeners.forEach((listener) => listener());
}

function subscribeOverrides(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Object hằng dùng chung — useSyncExternalStore yêu cầu snapshot ổn định tham chiếu
// (cùng 1 object) giữa các lần gọi, trả literal {} mới mỗi lần sẽ gây vòng lặp render.
const EMPTY_OVERRIDES: SectionOverrides = {};
function getServerOverrides(): SectionOverrides {
  return EMPTY_OVERRIDES;
}

export function AppSidebar({ permissions }: { permissions: PermissionKey[] }) {
  const pathname = usePathname();
  const permissionSet = new Set(permissions);
  const overrides = useSyncExternalStore(subscribeOverrides, readOverrides, getServerOverrides);

  const toggleSection = (title: string, currentlyOpen: boolean) => {
    writeOverrides({ ...readOverrides(), [title]: !currentlyOpen });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 px-5">
        <Image src="/logo-mark.png" alt="" aria-hidden="true" width={26} height={26} className="shrink-0" priority />
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

          const containsActive = visibleItems.some(
            (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
          );
          const collapsible = visibleItems.length > 1;
          const isOpen = !collapsible || (overrides[section.title] ?? containsActive);

          return (
            <div key={section.title} className="mb-1">
              {collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title, isOpen)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                >
                  {section.title}
                  {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
              ) : (
                <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  {section.title}
                </p>
              )}
              {isOpen && (
                <ul className="mb-3 flex flex-col gap-0.5">
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
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
