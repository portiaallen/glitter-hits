type PageHeroProps = {
  brand?: string;
  title: string;
  description: string;
  eyebrow?: string;
};

export function PageHero({
  brand = "Glitter Hits",
  title,
  description,
  eyebrow,
}: PageHeroProps) {
  return (
    <header className="relative overflow-hidden border-b border-[var(--border-glass)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--theme-wash),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--theme-wash-2),transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        {eyebrow && (
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
        )}
        <p className="animate-rise font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
          {brand.includes(" ") ? (
            <>
              {brand.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="gh-gradient-text">{brand.split(" ").slice(-1)}</span>
            </>
          ) : (
            <span className="gh-gradient-text">{brand}</span>
          )}
        </p>
        <h1 className="animate-rise-delay mt-3 max-w-3xl font-[family-name:var(--font-syne)] text-xl font-semibold text-[var(--text)] sm:text-2xl">
          {title}
        </h1>
        <p className="animate-rise-delay mt-4 max-w-2xl text-[var(--text-muted)]">{description}</p>
      </div>
    </header>
  );
}
