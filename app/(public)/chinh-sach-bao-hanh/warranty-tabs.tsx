"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Search, ShieldCheck, RefreshCcw } from "lucide-react";
import { RegisterForm } from "./register-form";
import { LookupPanel } from "./lookup-panel";
import { PolicyContent } from "./policy-content";
import { ReturnContent } from "./return-content";

type TabId = "register" | "lookup" | "policy" | "return";
const TABS: { id: TabId; label: string; icon: typeof ClipboardCheck }[] = [
  { id: "register", label: "Đăng ký", icon: ClipboardCheck },
  { id: "lookup", label: "Tra cứu", icon: Search },
  { id: "policy", label: "Chính sách bảo hành", icon: ShieldCheck },
  { id: "return", label: "Đổi trả & Hoàn tiền", icon: RefreshCcw },
];
const TAB_IDS = TABS.map((t) => t.id);
function isTabId(v: string): v is TabId {
  return (TAB_IDS as string[]).includes(v);
}

type Product = { id: string; name: string };

export function WarrantyTabs({ initialTab, products }: { initialTab: string; products: Product[] }) {
  const [tab, setTab] = useState<TabId>(isTabId(initialTab) ? initialTab : "policy");
  const [lookupPrefill, setLookupPrefill] = useState<string | undefined>(undefined);
  const router = useRouter();

  function switchTab(id: TabId) {
    setTab(id);
    router.replace(`?tab=${id}`, { scroll: false });
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex overflow-x-auto border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-8">
        {tab === "register" && (
          <RegisterForm
            products={products}
            onRegistered={(code) => {
              setLookupPrefill(code);
              switchTab("lookup");
            }}
          />
        )}
        {tab === "lookup" && <LookupPanel prefill={lookupPrefill} />}
        {tab === "policy" && <PolicyContent />}
        {tab === "return" && <ReturnContent />}
      </div>
    </div>
  );
}
