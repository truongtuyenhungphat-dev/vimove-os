"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const subscribeNoop = () => () => {};

/** Bật/tắt dark mode — token .dark đã có sẵn trong globals.css (Phase 1), chỉ thiếu UI
 * điều khiển. `mounted` tránh hydration mismatch vì theme thật chỉ biết được ở client —
 * dùng useSyncExternalStore (snapshot server=false/client=true) thay vì effect+setState
 * để không vi phạm rule "set-state-in-effect" của React Compiler. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted && resolvedTheme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  );
}
