export function LoginHeroPanel() {
  return (
    <div
      className="relative hidden overflow-hidden bg-sidebar lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--sidebar-foreground), transparent 92%) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Khối màu trang trí — không dùng ảnh chụp thật vì chưa có tài sản ảnh chính thức của VIMOVE */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--sidebar-primary), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 size-[28rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--sidebar-primary), transparent 70%)" }}
      />

      <span className="relative text-xl font-semibold tracking-tight text-sidebar-foreground">
        VIMOVE <span className="text-sidebar-primary">OS</span>
      </span>

      <div className="relative flex flex-col gap-4">
        <h2 className="text-3xl leading-tight font-semibold text-sidebar-foreground">
          Làm việc thông minh hơn.
          <br />
          Tăng trưởng nhanh hơn.
        </h2>
        <p className="max-w-sm text-sm text-sidebar-foreground/70">
          VIMOVE OS — nền tảng vận hành &amp; marketing toàn diện, hợp nhất công việc, quy trình,
          marketing, CRM/Sales, dữ liệu và AI cho doanh nghiệp.
        </p>
      </div>
    </div>
  );
}
