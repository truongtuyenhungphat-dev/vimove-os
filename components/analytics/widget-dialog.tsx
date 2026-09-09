"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  REPORT_DATASETS,
  REPORT_DATASET_LABELS,
  DATASET_DIMENSIONS,
  DATASET_METRICS,
  type ReportDataset,
  type ReportVisualization,
} from "@/lib/analytics/types";

// Chỉ cho chọn Bảng/Cột — 2 loại đã render thật (xem docs/07-analytics.md quyết định
// hoãn Đường/Tròn thay vì cho chọn rồi hiện sai/rỗng).
const AVAILABLE_VISUALIZATIONS: { value: ReportVisualization; label: string }[] = [
  { value: "TABLE", label: "Bảng" },
  { value: "BAR", label: "Cột" },
];

export function WidgetDialog({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dataset, setDataset] = useState<ReportDataset>("LEADS");
  const [dimension, setDimension] = useState(DATASET_DIMENSIONS.LEADS[0].value);
  const [metric, setMetric] = useState(DATASET_METRICS.LEADS[0].value);
  const [visualization, setVisualization] = useState<ReportVisualization>("TABLE");

  const dimensionItems = Object.fromEntries(DATASET_DIMENSIONS[dataset].map((d) => [d.value, d.label]));
  const metricItems = Object.fromEntries(DATASET_METRICS[dataset].map((m) => [m.value, m.label]));
  const visualizationItems = Object.fromEntries(AVAILABLE_VISUALIZATIONS.map((v) => [v.value, v.label]));

  function handleDatasetChange(v: ReportDataset) {
    setDataset(v);
    setDimension(DATASET_DIMENSIONS[v][0].value);
    setMetric(DATASET_METRICS[v][0].value);
  }

  function handleSubmit(formData: FormData) {
    formData.set("dataset", dataset);
    formData.set("dimension", dimension);
    formData.set("metric", metric);
    formData.set("visualization", visualization);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Đã thêm widget");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus /> Thêm widget
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm widget</DialogTitle>
          <DialogDescription>Dataset → Dimension → Metric → Visualization.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="widget-dataset">Dataset</Label>
            <Select
              items={Object.fromEntries(REPORT_DATASETS.map((d) => [d, REPORT_DATASET_LABELS[d]]))}
              value={dataset}
              onValueChange={(v) => handleDatasetChange(v as ReportDataset)}
            >
              <SelectTrigger id="widget-dataset" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_DATASETS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {REPORT_DATASET_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="widget-dimension">Dimension</Label>
              <Select items={dimensionItems} value={dimension} onValueChange={(v) => v && setDimension(v)}>
                <SelectTrigger id="widget-dimension" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATASET_DIMENSIONS[dataset].map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="widget-metric">Metric</Label>
              <Select items={metricItems} value={metric} onValueChange={(v) => v && setMetric(v)}>
                <SelectTrigger id="widget-metric" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATASET_METRICS[dataset].map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="widget-visualization">Hiển thị</Label>
            <Select items={visualizationItems} value={visualization} onValueChange={(v) => setVisualization(v as ReportVisualization)}>
              <SelectTrigger id="widget-visualization" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_VISUALIZATIONS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Đang lưu..." : "Thêm widget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
