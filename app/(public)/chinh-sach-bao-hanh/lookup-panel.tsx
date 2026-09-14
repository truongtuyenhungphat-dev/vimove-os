"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupWarrantyAction, type WarrantyLookupResult } from "./actions";
import { WarrantyResultCard } from "./warranty-result-card";

export function LookupPanel({ prefill }: { prefill?: string }) {
  const [value, setValue] = useState(prefill ?? "");
  const [results, setResults] = useState<WarrantyLookupResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function runLookup(input: string) {
    startTransition(async () => {
      const { results } = await lookupWarrantyAction(input);
      setResults(results);
    });
  }

  // Đăng ký xong bấm "Xem thông tin bảo hành" ở tab Đăng ký → tự điền mã và
  // tra luôn, giống hành vi của cổng cũ (khỏi phải gõ lại mã vừa nhận).
  useEffect(() => {
    if (prefill) runLookup(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Nhập <strong className="text-foreground">mã bảo hành</strong> (VM-XXXXXX) hoặc{" "}
          <strong className="text-foreground">số điện thoại</strong> để tra cứu
        </p>
        <div className="mx-auto flex max-w-md gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runLookup(value)}
            placeholder="VD: VM-A1B2C3 hoặc 0912345678"
            className="uppercase"
          />
          <Button onClick={() => runLookup(value)} disabled={isPending || !value.trim()}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            Tra cứu
          </Button>
        </div>
      </div>

      {results !== null && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">Không tìm thấy thông tin bảo hành</p>
          <p className="text-xs text-muted-foreground">
            Vui lòng kiểm tra lại mã bảo hành hoặc số điện thoại.
            <br />
            Chưa có mã? Đăng ký ở tab bên cạnh.
          </p>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          {results.map((r) => (
            <WarrantyResultCard key={r.warrantyCode} data={r} />
          ))}
        </div>
      )}
    </div>
  );
}
