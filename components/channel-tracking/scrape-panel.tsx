"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABEL, fmtNumber, type ConfigPlatform } from "@/lib/channel-tracking/types";
import type { getScrapeStatus } from "@/services/channel-tracking/apify";

type ScrapeStatus = Awaited<ReturnType<typeof getScrapeStatus>>;

export function ScrapePanel({
  status,
  canUpdate,
  scrapeNowAction,
  updatePlatformConfigAction,
}: {
  status: ScrapeStatus;
  canUpdate: boolean;
  scrapeNowAction: () => Promise<{ started: { platform: string; runId: string; channels: number }[] }>;
  updatePlatformConfigAction: (data: { platform: string; apifyActor?: string; isActive?: boolean }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function scrapeNow() {
    startTransition(async () => {
      try {
        const result = await scrapeNowAction();
        const total = result.started.reduce((s, r) => s + r.channels, 0);
        toast.success(result.started.length ? `Đã khởi chạy quét ${total} kênh trên ${result.started.length} nền tảng` : "Không có kênh nào để quét");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <StatusPill ok={status.tokenSet} label="APIFY_TOKEN" />
            <StatusPill ok={status.webhookSecretSet} label="APIFY_WEBHOOK_SECRET" />
            <span className="text-muted-foreground">
              Hôm nay: <span className="font-medium text-foreground">{status.channelsScannedToday}</span>/{status.channelsTotal} kênh đã quét
            </span>
          </div>
          {canUpdate && (
            <Button size="sm" onClick={scrapeNow} disabled={isPending || !status.tokenSet}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {isPending ? "Đang chạy…" : "Quét ngay"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Chi phí hôm nay" value={`$${status.cost.today.toFixed(2)}`} />
        <StatCard label="Chi phí 30 ngày" value={`$${status.cost.last30d.toFixed(2)}`} />
        <StatCard label="Kênh đang theo dõi" value={fmtNumber(status.channelsTotal)} />
        <StatCard label="Chưa quét hôm nay" value={fmtNumber(status.notScanned.length)} tone={status.notScanned.length > 0 ? "warn" : undefined} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Cấu hình Actor theo nền tảng</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nền tảng</TableHead>
                <TableHead>Apify Actor</TableHead>
                <TableHead className="w-24">Bật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.configs.map((cfg) => (
                <ConfigRow key={cfg.platform} config={cfg} canUpdate={canUpdate} updateAction={updatePlatformConfigAction} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {status.notScanned.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="size-4 text-amber-500" /> Kênh chưa quét được hôm nay ({status.notScanned.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {status.notScanned.map((c) => (
              <Badge key={c.id} variant="outline" className="font-normal">
                {PLATFORM_LABEL[c.platform as ConfigPlatform]} · @{c.username}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium">20 run Apify gần nhất</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nền tảng</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Số kênh</TableHead>
                <TableHead className="text-right">Chi phí</TableHead>
                <TableHead>Bắt đầu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Chưa có run nào. Bấm &quot;Quét ngay&quot; để chạy thử.
                  </TableCell>
                </TableRow>
              ) : (
                status.runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.platform ? PLATFORM_LABEL[r.platform as ConfigPlatform] : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.actor ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "succeeded"
                            ? "border-transparent bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400"
                            : r.status === "failed"
                              ? "border-transparent bg-destructive/10 font-normal text-destructive"
                              : "border-transparent bg-muted font-normal text-muted-foreground"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.channelsCount ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.costUsd != null ? `$${r.costUsd.toFixed(3)}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(r.startedAt).toLocaleString("vi-VN")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-destructive" />}
      <span className={ok ? "text-foreground" : "text-destructive"}>{label}</span>
    </span>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className={`text-2xl font-semibold ${tone === "warn" ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ConfigRow({
  config,
  canUpdate,
  updateAction,
}: {
  config: { platform: string; apifyActor: string; isActive: boolean };
  canUpdate: boolean;
  updateAction: (data: { platform: string; apifyActor?: string; isActive?: boolean }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function saveActor(value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === config.apifyActor) return;
    startTransition(async () => {
      try {
        await updateAction({ platform: config.platform, apifyActor: trimmed });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  function toggleActive(checked: boolean) {
    startTransition(async () => {
      try {
        await updateAction({ platform: config.platform, isActive: checked });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <TableRow>
      <TableCell>{PLATFORM_LABEL[config.platform as ConfigPlatform] ?? config.platform}</TableCell>
      <TableCell>
        <Input defaultValue={config.apifyActor} disabled={!canUpdate || isPending} className="h-8 max-w-xs" onBlur={(e) => saveActor(e.currentTarget.value)} />
      </TableCell>
      <TableCell>
        <Label className="flex items-center">
          <Switch checked={config.isActive} disabled={!canUpdate || isPending} onCheckedChange={toggleActive} />
        </Label>
      </TableCell>
    </TableRow>
  );
}
