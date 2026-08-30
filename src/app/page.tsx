import Link from "next/link";
import { prisma } from "@/lib/db";
import { estimateNetworkAvailability } from "@/lib/delivery/engine";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";
import { collectiblesForTheme } from "@/lib/experience/collectibles";

export default async function HomePage() {
  const [availability, spotlights, queerdomCount, brandCount, theme] = await Promise.all([
    estimateNetworkAvailability(),
    prisma.featuredPlacement.findMany({
      where: { status: "active", type: "homepage_spotlight" },
      include: { website: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.website.count({ where: { isQueerdomPick: true, moderationStatus: "approved" } }),
    prisma.brand.count({ where: { isEnabled: true, network: "founder" } }),
    getActiveMonthlyTheme(),
  ]);

  const collectibles = collectiblesForTheme(theme.slug).slice(0, 3);

  return (
    <div>
      {/* Hero — one composition: brand, headline, support, CTAs, full-bleed atmosphere */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 30%, var(--theme-wash), transparent 60%),
              radial-gradient(ellipse 70% 50% at 85% 20%, var(--theme-wash-2), transparent 55%),
              radial-gradient(ellipse 50% 40% at 60% 90%, rgba(255,197,61,0.12), transparent 50%)
            `,
          }}
        />
        <div
          className="animate-float absolute -right-16 top-24 h-64 w-64 rounded-full opacity-40 blur-3xl sm:right-10"
          aria-hidden
          style={{ background: "var(--theme-accent)" }}
        />
        <div
          className="animate-float absolute -left-10 bottom-24 h-48 w-48 rounded-full opacity-30 blur-3xl"
          aria-hidden
          style={{ background: "var(--theme-accent-2)", animationDelay: "1.2s" }}
        />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
          <p className="gh-theme-chip animate-rise w-fit">{theme.name}</p>
          <p className="animate-rise mt-5 font-[family-name:var(--font-syne)] text-5xl font-extrabold tracking-tight text-[var(--text)] sm:text-6xl md:text-7xl">
            Glitter Hits
          </p>
          <h1 className="animate-rise-delay mt-4 max-w-2xl font-[family-name:var(--font-syne)] text-2xl font-semibold text-[var(--text)] sm:text-4xl">
            Come get your traffic.
          </h1>
          <p className="animate-rise-delay mt-5 max-w-xl text-base text-[var(--text-muted)] sm:text-lg">
            Exchange visits. Discover websites. Have a little fun while you&apos;re at it.
          </p>
          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="gh-btn gh-btn-primary">
              Start exploring
            </Link>
            <Link href="/websites/new" className="gh-btn gh-btn-ghost">
              Get your site seen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
          Looks like a traffic exchange. Feels like something else.
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
          {theme.heroHint} You explore sites to collect Hits, then spend them so others discover
          yours — fair, labeled, and surprisingly entertaining.
        </p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Explore the Hits",
              body: "Flip through real websites like channels. Watch, discover, collect Hits.",
            },
            {
              step: "02",
              title: "Collect Hits",
              body: "Every fair visit earns integer Glitter Hits — never fake popularity.",
            },
            {
              step: "03",
              title: "Get seen",
              body: "Put Hits on your campaigns and join the exchange the playful way.",
            },
          ].map((item) => (
            <li key={item.step} className="relative pl-1">
              <p className="font-[family-name:var(--font-syne)] text-sm font-bold text-[var(--theme-accent)]">
                {item.step}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="gh-prism-border relative overflow-hidden rounded-[1.5rem] p-8 sm:p-10">
          <p className="gh-theme-chip">{theme.name}</p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold sm:text-3xl">
            {theme.tagline}
          </h2>
          <p className="mt-3 max-w-xl text-[var(--text-muted)]">
            {theme.discoveryLine} This month&apos;s vibe:{" "}
            <strong className="text-[var(--text)]">{theme.collectibleName}</strong>.{" "}
            {theme.collectibleHint}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {collectibles.map((c) => (
              <span key={c.slug} className="gh-badge">
                {c.name}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/surf" className="gh-btn gh-btn-primary">
              Explore today&apos;s Hits
            </Link>
            <Link href="/feedback" className="gh-btn gh-btn-ghost">
              Suggest next month&apos;s theme
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
          A growing playground — not a vanity metric
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          Live snapshots of the network. Not delivery guarantees. Not inflated popularity.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="gh-badge">{availability.activeCampaigns} active campaigns</span>
          <span className="gh-badge">{queerdomCount} Queerdom Picks</span>
          <span className="gh-badge">{brandCount} Founder brands</span>
        </div>
      </section>

      {spotlights.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Today&apos;s spotlights
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Curated promotional placements — discovery, not manufactured hype.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {spotlights.map((s) => (
              <a
                key={s.id}
                href={s.targetUrl || s.website?.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="gh-glass block p-5 transition hover:-translate-y-0.5"
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
        <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border-glass)] bg-white/70 p-8 shadow-[var(--shadow-soft)] sm:p-12">
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--theme-accent)" }}
          />
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
            Built for the Queerdom
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
            Explore Queerdom Picks and the Founder Network — brands that grow with every new
            venture, without rewriting the playground.
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
