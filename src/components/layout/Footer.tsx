import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-[family-name:var(--font-syne)] text-xl font-bold">
            Glitter Hits
          </p>
          <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Get Seen. Get Hits. Get Glitter. A transparent promotional discovery
            network for the Queerdom — not fake popularity.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
            Explore
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li><Link href="/browse">Directory</Link></li>
            <li><Link href="/trending">Trending</Link></li>
            <li><Link href="/featured">Featured</Link></li>
            <li><Link href="/queerdom-picks">Queerdom Picks</Link></li>
            <li><Link href="/founder-network">Founder Network</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
            Platform
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li><Link href="/how-it-works">How it works</Link></li>
            <li><Link href="/rewards">Rewards</Link></li>
            <li><Link href="/referrals">Referrals</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} Glitter Hits · Part of the Queerdom ecosystem ·
        Exchange traffic is always labeled honestly.
      </div>
    </footer>
  );
}
