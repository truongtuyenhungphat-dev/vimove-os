// SVG line chart tối giản, không dùng thư viện ngoài (đúng tinh thần "no new heavy UI
// deps" đã áp dụng từ Phase 2 cho Calendar/Timeline/Gantt) — đủ cho xu hướng theo
// ngày ở Executive dashboard.
export function Sparkline({ data, width = 560, height = 120, color = "var(--primary)" }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Biểu đồ xu hướng theo ngày">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
