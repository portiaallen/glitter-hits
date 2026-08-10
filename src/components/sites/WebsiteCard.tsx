import Link from "next/link";

type WebsiteCardProps = {
  title: string;
  url: string;
  description?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  badges?: string[];
  discoverCount?: number;
};

export function WebsiteCard({
  title,
  url,
  description,
  categoryName,
  categorySlug,
  badges = [],
  discoverCount,
}: WebsiteCardProps) {
  return (
    <article className="gh-glass flex flex-col p-5 transition hover:border-pink-400/35">
      <div className="mb-3 flex flex-wrap gap-2">
        {badges.map((b) => (
          <span key={b} className="gh-badge">
            {b}
          </span>
        ))}
        {categoryName && categorySlug && (
          <Link href={`/categories/${categorySlug}`} className="gh-badge hover:text-white">
            {categoryName}
          </Link>
        )}
      </div>
      <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--neon-cyan)] hover:underline"
        >
          Visit site
        </a>
        {typeof discoverCount === "number" && (
          <span className="text-xs text-white/40">{discoverCount.toLocaleString()} discovers</span>
        )}
      </div>
    </article>
  );
}
