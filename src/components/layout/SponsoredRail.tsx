import Link from "next/link";
import { listActivePlacements } from "@/lib/placements/service";

export async function SponsoredRail({
  types = ["banner_ad", "text_ad", "sponsored_discovery"],
  title = "Sponsored",
}: {
  types?: ("banner_ad" | "text_ad" | "sponsored_discovery" | "trending_placement" | "category_spotlight")[];
  title?: string;
}) {
  const placements = await listActivePlacements(types);
  if (placements.length === 0) return null;

  return (
    <aside className="gh-glass p-4" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-white/40">{title}</p>
        <Link href="/featured" className="text-xs text-[var(--neon-cyan)]">
          All →
        </Link>
      </div>
      <ul className="space-y-3">
        {placements.slice(0, 4).map((p) => {
          const href = p.targetUrl || p.website?.url || "#";
          const label = p.title || p.website?.title || "Sponsored";
          return (
            <li key={p.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block rounded-xl px-2 py-2 transition hover:bg-white/5"
              >
                <p className="text-sm font-medium">{label}</p>
                {p.body ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{p.body}</p>
                ) : null}
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                  {p.type.replaceAll("_", " ")} · exchange promo
                </p>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
