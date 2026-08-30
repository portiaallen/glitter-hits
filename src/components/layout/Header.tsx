import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/logout";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";

const nav = [
  { href: "/browse", label: "Explore" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/queerdom-picks", label: "Queerdom Picks" },
  { href: "/founder-network", label: "Founder Network" },
  { href: "/pricing", label: "Pricing" },
];

export async function Header() {
  const [session, theme] = await Promise.all([auth(), getActiveMonthlyTheme()]);

  return (
    <header className="relative z-20 border-b border-[var(--border-glass)] bg-[var(--bg-glass)]5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--prism)] text-sm font-bold text-[#1a1028] shadow-[var(--shadow-lift)]">
            GH
          </span>
          <span className="truncate font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight sm:text-xl">
            Glitter <span className="gh-gradient-text">Hits</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-[var(--text-muted)] lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[var(--text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="gh-theme-chip hidden max-w-[10rem] truncate sm:inline-flex" title={theme.tagline}>
            {theme.name}
          </span>
          {session?.user ? (
            <>
              <NotificationBell />
              <Link href="/dashboard" className="gh-btn gh-btn-ghost hidden px-3 py-2 text-sm sm:inline-flex">
                Home
              </Link>
              <Link href="/surf" className="gh-btn gh-btn-primary px-3 py-2 text-sm">
                Explore Hits
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button type="submit" className="gh-btn gh-btn-ghost px-3 py-2 text-sm">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="gh-btn gh-btn-ghost px-3 py-2 text-sm">
                Log in
              </Link>
              <Link href="/signup" className="gh-btn gh-btn-primary px-3 py-2 text-sm">
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
