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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <Link href="/" className="group flex min-w-0 items-center gap-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--prism)] text-sm font-bold text-[#1a1028] shadow-[var(--shadow-lift)]">
            GT
          </span>
          <span className="truncate font-[family-name:var(--font-syne)] text-base font-bold tracking-tight sm:text-lg">
            Glitter <span className="gh-gradient-text">Traffic</span>
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
          <span className="hidden max-w-[10rem] sm:inline-flex">
            <span className="gh-theme-chip truncate" title={theme.tagline}>
              {theme.name}
            </span>
          </span>
          {session?.user ? (
            <>
              <NotificationBell />
              <Link href="/dashboard" className="gh-btn gh-btn-ghost hidden px-3 py-2 text-sm sm:inline-flex">
                Home
              </Link>
              <Link href="/surf" className="gh-btn gh-btn-primary px-3 py-2 text-sm">
                Explore Traffic
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button type="submit" className="gh-btn gh-btn-ghost px-3 py-2 text-sm">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="gh-btn gh-btn-ghost whitespace-nowrap px-2.5 py-2 text-sm sm:px-3">
                Log in
              </Link>
              <Link href="/signup" className="gh-btn gh-btn-primary whitespace-nowrap px-2.5 py-2 text-sm sm:px-3">
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
