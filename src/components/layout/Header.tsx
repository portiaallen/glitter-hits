import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/logout";

const nav = [
  { href: "/browse", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/queerdom-picks", label: "Queerdom Picks" },
  { href: "/founder-network", label: "Founder Network" },
  { href: "/pricing", label: "Pricing" },
];

export async function Header() {
  const session = await auth();

  return (
    <header className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-cyan-300 text-sm font-bold text-black shadow-[0_0_20px_rgba(255,79,216,0.45)]">
            GH
          </span>
          <span className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight sm:text-xl">
            Glitter <span className="gh-gradient-text">Hits</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-[var(--text-muted)] lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="gh-btn gh-btn-ghost px-3 py-2 text-sm">
                Dashboard
              </Link>
              <Link href="/surf" className="gh-btn gh-btn-primary px-3 py-2 text-sm">
                Surf
              </Link>
              <form action={logoutAction}>
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
