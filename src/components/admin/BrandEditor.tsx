"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BrandEditor() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const slug = String(form.get("slug") || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_brand",
        brand: {
          name: form.get("name"),
          slug,
          url: form.get("url"),
          description: form.get("description") || undefined,
          category: form.get("category") || undefined,
          network: form.get("network") || "founder",
          isFeatured: form.get("isFeatured") === "on",
          isEnabled: form.get("isEnabled") === "on",
          sortOrder: Number(form.get("sortOrder") || 0),
        },
      }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Saved ${data.brand?.name}` : data.error);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass grid gap-3 p-5 sm:grid-cols-2">
      <h3 className="font-semibold sm:col-span-2">Add / update brand</h3>
      <div>
        <label className="gh-label" htmlFor="name">Name</label>
        <input id="name" name="name" required className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="slug">Slug</label>
        <input id="slug" name="slug" required className="gh-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="gh-label" htmlFor="url">URL</label>
        <input id="url" name="url" type="url" required className="gh-input" />
      </div>
      <div className="sm:col-span-2">
        <label className="gh-label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2} className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="category">Category</label>
        <input id="category" name="category" className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="network">Network</label>
        <select id="network" name="network" className="gh-input" defaultValue="founder">
          <option value="founder">Founder</option>
          <option value="partner">Partner</option>
          <option value="community">Community</option>
        </select>
      </div>
      <div>
        <label className="gh-label" htmlFor="sortOrder">Sort order</label>
        <input id="sortOrder" name="sortOrder" type="number" defaultValue={0} className="gh-input" />
      </div>
      <div className="flex items-end gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" /> Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isEnabled" defaultChecked /> Enabled
        </label>
      </div>
      {msg && <p className="text-sm text-[var(--neon-cyan)] sm:col-span-2">{msg}</p>}
      <button disabled={busy} type="submit" className="gh-btn gh-btn-primary sm:col-span-2">
        Save brand
      </button>
    </form>
  );
}
