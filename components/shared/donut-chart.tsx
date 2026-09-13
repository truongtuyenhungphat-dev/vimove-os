// Biểu đồ tròn (donut) có số tổng ở giữa + legend — tham khảo widget "Công
// việc của tôi"/"Tình trạng công việc" của MISA AMIS (Tổng quan), dựng bằng
// SVG thuần (không thêm thư viện chart mới) theo đúng nguyên tắc "không cài
// thêm package trừ khi thực sự cần" của dự án.
export type DonutSegment = { label: string; value: number; colorVar: string };

export function DonutChart({
  segments,
  centerLabel,
  size = 140,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--muted)" strokeWidth="14" />
          {total > 0 &&
            segments
              .filter((s) => s.value > 0)
              .map((s) => {
                const frac = s.value / total;
                const dash = `${frac * circumference} ${circumference}`;
                const offset = -acc * circumference;
                acc += frac;
                return (
                  <circle
                    key={s.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={s.colorVar}
                    strokeWidth="14"
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                  />
                );
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 shrink-0 rounded-full" style={{ background: s.colorVar }} />
              {s.label}
            </span>
            <span className="font-medium tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
