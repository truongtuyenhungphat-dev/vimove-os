"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Plug, Unplug, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AD_PLATFORM_LABELS, AD_CONNECTION_STATUS_LABELS, type AdPlatform, type AdConnectionStatus } from "@/lib/ads/types";

export type ConnectionCardData = {
  platform: AdPlatform;
  isConfigured: boolean;
  connection: {
    id: string;
    status: AdConnectionStatus;
    accountLabel: string | null;
    connectedBy: { name: string };
    lastSyncedAt: string | null;
    lastSyncError: string | null;
    adAccountCount: number;
  } | null;
};

const STATUS_STYLE: Record<AdConnectionStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONNECTED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ERROR: "bg-destructive/10 text-destructive",
  DISCONNECTED: "bg-muted text-muted-foreground",
};

export function ConnectionCard({
  data,
  canManage,
  onConnect,
  onDisconnect,
  onSync,
}: {
  data: ConnectionCardData;
  canManage: boolean;
  onConnect: (platform: string) => Promise<string>;
  onDisconnect: (connectionId: string) => Promise<void>;
  onSync: (connectionId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const status = data.connection?.status ?? "PENDING";
  const isConnected = status === "CONNECTED";

  function handleConnect() {
    startTransition(async () => {
      try {
        const url = await onConnect(data.platform);
        window.location.href = url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function handleDisconnect() {
    if (!data.connection) return;
    startTransition(async () => {
      try {
        await onDisconnect(data.connection!.id);
        toast.success("Đã ngắt kết nối");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function handleSync() {
    if (!data.connection) return;
    startTransition(async () => {
      try {
        await onSync(data.connection!.id);
        toast.success("Đã đồng bộ");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{AD_PLATFORM_LABELS[data.platform]}</CardTitle>
        <Badge variant="outline" className={`border-transparent font-normal ${STATUS_STYLE[status]}`}>
          {AD_CONNECTION_STATUS_LABELS[status]}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!data.isConfigured && (
          <p className="text-xs text-muted-foreground">
            Chưa cấu hình App ID/Secret trong biến môi trường — xem <code className="rounded bg-muted px-1 py-0.5">.env.example</code>.
          </p>
        )}
        {data.connection && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>Kết nối bởi {data.connection.connectedBy.name}</p>
            <p>{data.connection.adAccountCount} tài khoản quảng cáo</p>
            {data.connection.lastSyncedAt && <p>Đồng bộ lần cuối: {new Date(data.connection.lastSyncedAt).toLocaleString("vi-VN")}</p>}
            {data.connection.lastSyncError && <p className="text-destructive">Lỗi: {data.connection.lastSyncError}</p>}
          </div>
        )}
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <Button type="button" size="sm" variant="outline" disabled={!data.isConfigured || isPending} onClick={handleConnect}>
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plug aria-hidden="true" />}
                Kết nối
              </Button>
            ) : (
              <>
                <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleSync}>
                  {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                  Đồng bộ
                </Button>
                <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={isPending} onClick={handleDisconnect}>
                  <Unplug aria-hidden="true" />
                  Ngắt kết nối
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
