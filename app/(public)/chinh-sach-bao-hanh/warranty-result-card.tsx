import { WARRANTY_STATUS_LABELS } from "@/lib/warranty/types";
import type { WarrantyLookupResult } from "./actions";

const STATUS_BADGE: Record<WarrantyLookupResult["status"], string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  CLAIMED: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-rose-100 text-rose-700",
  VOIDED: "bg-muted text-muted-foreground",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// % thời gian bảo hành đã dùng + số ngày còn lại — cùng công thức với cổng cũ
// (chinh-sach-bao-hanh/index.html, hàm warrantyProgress).
function progress(purchaseDate: string | null, warrantyExpiry: string | null) {
  if (!purchaseDate || !warrantyExpiry) return null;
  const start = new Date(purchaseDate).getTime();
  const end = new Date(warrantyExpiry).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  const daysLeft = Math.max(0, Math.round((end - now) / 86400000));
  return { pct, daysLeft };
}

export function WarrantyResultCard({ data }: { data: WarrantyLookupResult }) {
  const p = progress(data.purchaseDate, data.warrantyExpiry);
  const barColor = !p ? "bg-muted-foreground" : p.daysLeft > 180 ? "bg-emerald-500" : p.daysLeft > 60 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-primary/5 px-5 py-4">
        <p className="text-xs text-muted-foreground">Mã bảo hành</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xl font-bold tracking-wider">{data.warrantyCode}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[data.status]}`}>
            {WARRANTY_STATUS_LABELS[data.status]}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-4 text-sm">
        <Row label="Khách hàng" value={data.customerName} />
        <Row label="Điện thoại" value={data.customerPhone} />
        <Row label="Sản phẩm" value={data.productName} />
        {data.color && <Row label="Màu sắc" value={data.color} />}
        {data.size && <Row label="Kích thước" value={data.size} />}
        {data.purchaseChannel && <Row label="Kênh mua" value={data.purchaseChannel} />}
        <Row label="Ngày mua" value={fmtDate(data.purchaseDate)} />
        <Row label="Hết hạn BH" value={fmtDate(data.warrantyExpiry)} valueClassName={p && p.daysLeft === 0 ? "text-rose-600" : "text-emerald-600"} />

        {p && (
          <div className="mt-1">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Thời gian bảo hành đã dùng</span>
              <span className="font-medium">{p.daysLeft > 0 ? `${p.daysLeft} ngày còn lại` : "Đã hết hạn"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p.pct}%` }} />
            </div>
          </div>
        )}

        {data.notes && (
          <div className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{data.notes}</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClassName ?? ""}`}>{value}</span>
    </div>
  );
}
