import Link from "next/link";
import { prisma } from "@/lib/db";
import { estimateNetworkAvailability } from "@/lib/delivery/engine";

export default async function HomePage() {
  const [availability, spotlights, queerdomCount, brandCount] = await Promise.all([
    estimateNetworkAvailability(),
    prisma.featuredPlacement.findMany({
      where: { status: "active", type: "homepage_spotlight" },
      include: { website: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.website.count({ where: { isQueerdomPick: true, moderationStatus: "approved" } }),
    prisma.brand.count({ where: { isEnabled: true, network: "founder" } }),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,79,216,0.15),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
          <p className="animate-rise font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
            Glitter Hits
          </p>
          <h1 className="animate-rise-delay mt-4 max-w-3xl font-[family-name:var(--font-syne)] text-2xl font-semibold text-white/95 sm:text-4xl">
            Surf. Spark. Share. Get Lucky.
          </h1>
          <p className="animate-rise-delay mt-5 max-w-xl text-base text-[var(--text-muted)] sm:text-lg">
            Discover websites. Earn Hits. Grow Luck. Claim Glitter Drops.
            A transparent traffic exchange for the Queerdom — glamorous, fair,
            and never fake.
          </p>
          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="gh-btn gh-btn-primary">
              Start discovering
            </Link>
            <Link href="/how-it-works" className="gh-btn gh-btn-ghost">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
          A growing exchange — not a vanity metric
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          Inventory depends on real members and approved campaigns. Numbers below are live
          snapshots, not delivery guarantees or inflated popularity claims.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          <span className="gh-badge">{availability.activeCampaigns} active campaigns</span>
          <span className="gh-badge">{queerdomCount} Queerdom Picks</span>
          <span className="gh-badge">{brandCount} Founder brands</span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
            Discover. Earn. Promote.
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
            One job per loop — surf to earn Glitter Hits, then spend them on campaigns
            with real targeting and honest analytics.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Manual Surf",
              body: "A beautiful countdown viewer. Pause, skip when allowed, report issues, and earn integer credits.",
            },
            {
              title: "Smart delivery",
              body: "Campaigns match on geo, device, schedule, frequency, priority, and available credits — fairly.",
            },
            {
              title: "Transparent traffic",
              body: "Every visit is labeled as exchange traffic. No spoofed Google, social, or fake organic claims.",
            },
          ].map((item) => (
            <div key={item.title} className="gh-glass p-6">
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {spotlights.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Homepage Spotlight
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Premium promotional inventory — curated placement, not manufactured popularity.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {spotlights.map((s) => (
              <a
                key={s.id}
                href={s.targetUrl || s.website?.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="gh-glass block p-5 transition hover:border-pink-400/40"
              >
                <p className="gh-badge mb-3">Spotlight</p>
                <p className="font-semibold">{s.title || s.website?.title}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{s.body}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="gh-glass relative overflow-hidden p-8 sm:p-12">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
            Built for the Queerdom
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
            Explore Queerdom Picks and the Founder Network — admin-managed brands that grow
            with every new venture, without rewriting the platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/queerdom-picks" className="gh-btn gh-btn-primary">
              Queerdom Picks
            </Link>
            <Link href="/founder-network" className="gh-btn gh-btn-ghost">
              Founder Network
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
