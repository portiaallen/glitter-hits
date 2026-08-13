import { AppNav } from "@/components/layout/AppNav";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 md:pb-6">
      <AppNav />
      {title ? (
        <header className="mb-6">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
