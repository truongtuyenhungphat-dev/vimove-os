"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ErrorLogRow({
  message,
  path,
  stack,
  timeLabel,
}: {
  message: string;
  path: string | null;
  stack: string | null;
  timeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!stack}
        className="flex w-full items-start gap-2 text-left disabled:cursor-default"
      >
        {stack ? (
          open ? (
            <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="mt-0.5 size-4 shrink-0" />
        )}
        <span className="flex-1">
          <span className="block text-sm font-medium text-destructive">{message}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {timeLabel}
            {path && <> · {path}</>}
          </span>
        </span>
      </button>
      {open && stack && (
        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground">{stack}</pre>
      )}
    </div>
  );
}
