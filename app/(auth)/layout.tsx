export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-2xl font-semibold tracking-tight text-sidebar-foreground">
            VIMOVE <span className="text-sidebar-primary">OS</span>
          </span>
          <p className="text-sm text-sidebar-foreground/70">
            Business Operating System
          </p>
        </div>
        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
