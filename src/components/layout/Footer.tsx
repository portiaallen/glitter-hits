import Link from "next/link";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";

export async function Footer() {
  const theme = await getActiveMonthlyTheme();

  return (
    <footer className="relative z-10 mt-auto border-t border-[var(--border-glass)] bg-[var(--bg-glass)]0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-[family-name:var(--font-syne)] text-xl font-bold">
            Glitter <span className="gh-gradient-text">Hits</span>
          </p>
          <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Come play with us. Come get your traffic. Come discover something new.
            A transparent promotional discovery network — not fake popularity.
          </p>
          <p className="gh-theme-chip mt-4">{theme.name} · {theme.collectibleName}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Explore
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li>
              <Link href="/browse">Directory</Link>
            </li>
            <li>
              <Link href="/surf">Explore the Hits</Link>
            </li>
            <li>
              <Link href="/trending">Trending</Link>
            </li>
            <li>
              <Link href="/leaderboards">Leaderboards</Link>
            </li>
            <li>
              <Link href="/queerdom-picks">Queerdom Picks</Link>
            </li>
            <li>
              <Link href="/founder-network">Founder Network</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Platform
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li>
              <Link href="/how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="/collectibles">Collectibles</Link>
            </li>
            <li>
              <Link href="/feedback">Tell Glitter Hits</Link>
            </li>
            <li>
              <Link href="/rewards">Rewards</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border-glass)] px-4 py-4 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} Glitter Hits · Volume 111 energy · Exchange traffic is
        always labeled honestly.
      </div>
    </footer>
  );
}
