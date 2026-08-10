"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

type Category = { id: string; name: string; slug: string };

export default function NewWebsitePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetch("/api/websites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: form.get("url"),
        title: form.get("title"),
        description: form.get("description") || undefined,
        categoryId: form.get("categoryId") || undefined,
        tags,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Failed to add website");
      return;
    }
    router.push("/websites");
    router.refresh();
  }

  return (
    <AppShell title="Add Website" subtitle="We’ll validate reachability and queue moderation when needed.">
      <form onSubmit={onSubmit} className="gh-glass mx-auto max-w-xl space-y-4 p-6">
        <div>
          <label className="gh-label" htmlFor="url">URL</label>
          <input id="url" name="url" required type="url" className="gh-input" placeholder="https://" />
        </div>
        <div>
          <label className="gh-label" htmlFor="title">Title</label>
          <input id="title" name="title" required className="gh-input" />
        </div>
        <div>
          <label className="gh-label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="gh-input" />
        </div>
        <div>
          <label className="gh-label" htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" className="gh-input">
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="gh-label" htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" className="gh-input" placeholder="queer, creators" />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={busy} className="gh-btn gh-btn-primary">
          {busy ? "Submitting…" : "Submit website"}
        </button>
      </form>
    </AppShell>
  );
}
