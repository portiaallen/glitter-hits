"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  logoUrl: string | null;
  category: string | null;
  network: string;
  isFeatured: boolean;
  isEnabled: boolean;
  sortOrder: number;
};

const EMPTY = {
  id: "",
  name: "",
  slug: "",
  url: "",
  description: "",
  logoUrl: "",
  category: "",
  network: "founder",
  isFeatured: false,
  isEnabled: true,
  sortOrder: 0,
};

export function BrandDirectory({ brands }: { brands: BrandRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function edit(brand: BrandRow) {
    setForm({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      url: brand.url,
      description: brand.description ?? "",
      logoUrl: brand.logoUrl ?? "",
      category: brand.category ?? "",
      network: brand.network,
      isFeatured: brand.isFeatured,
      isEnabled: brand.isEnabled,
      sortOrder: brand.sortOrder,
    });
    setMessage(null);
    setError(null);
  }

  function reset() {
    setForm({ ...EMPTY });
    setError(null);
    setMessage(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const brand = {
        ...(form.id ? { id: form.id } : {}),
        name: form.name.trim(),
        slug: form.slug.trim(),
        url: form.url.trim(),
        description: form.description.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        category: form.category.trim() || undefined,
        network: form.network || "founder",
        isFeatured: form.isFeatured,
        isEnabled: form.isEnabled,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert_brand", brand }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(form.id ? "Brand updated." : "Brand created.");
      reset();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-8">
      <section className="gh-glass p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
          Brand Directory
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          The <strong className="text-[var(--text)]">Founder Network</strong> is admin-managed
          through this directory — it is not hard-coded in the app. Add, edit, feature, or disable
          brands here; they appear on public brand surfaces when enabled.
        </p>
      </section>

      <form onSubmit={onSubmit} className="gh-glass grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2">
          <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            {form.id ? "Edit brand" : "Add brand"}
          </h3>
        </div>

        <div>
          <label className="gh-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="gh-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            className="gh-input"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="gh-label" htmlFor="url">
            URL
          </label>
          <input
            id="url"
            type="url"
            className="gh-input"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="gh-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="gh-input min-h-[88px]"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="logoUrl">
            Logo URL
          </label>
          <input
            id="logoUrl"
            className="gh-input"
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            className="gh-input"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
        </div>
        <div>
          <label className="gh-label" htmlFor="network">
            Network
          </label>
          <select
            id="network"
            className="gh-input"
            value={form.network}
            onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
          >
            <option value="founder">founder</option>
            <option value="partner">partner</option>
            <option value="community">community</option>
          </select>
        </div>
        <div>
          <label className="gh-label" htmlFor="sortOrder">
            Sort order
          </label>
          <input
            id="sortOrder"
            type="number"
            className="gh-input"
            value={form.sortOrder}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: Number.parseInt(e.target.value, 10) || 0 }))
            }
          />
        </div>
        <div className="flex items-center gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))}
            />
            Enabled
          </label>
        </div>

        {error && <p className="text-sm text-[var(--danger)] sm:col-span-2">{error}</p>}
        {message && <p className="text-sm text-[var(--success)] sm:col-span-2">{message}</p>}

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" className="gh-btn gh-btn-primary" disabled={pending}>
            {form.id ? "Update brand" : "Create brand"}
          </button>
          {form.id && (
            <button type="button" className="gh-btn gh-btn-ghost" onClick={reset}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section className="gh-glass overflow-hidden">
        <div className="border-b border-[var(--border-glass)] px-6 py-5">
          <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Directory ({brands.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--bg-glass)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Network</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-t border-[var(--border-glass)]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{brand.name}</p>
                    <a
                      href={brand.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--neon-cyan)] hover:underline"
                    >
                      {brand.url}
                    </a>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{brand.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="gh-badge">{brand.network}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {brand.isFeatured && <span className="gh-badge">featured</span>}
                      <span
                        className="gh-badge"
                        style={{
                          color: brand.isEnabled ? "var(--success)" : "var(--danger)",
                        }}
                      >
                        {brand.isEnabled ? "enabled" : "disabled"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{brand.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="gh-btn gh-btn-ghost px-3 py-1.5 text-xs"
                      onClick={() => edit(brand)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No brands yet. Add the first Founder Network entry above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
