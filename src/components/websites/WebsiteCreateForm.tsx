"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WebsiteCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const tagsRaw = String(form.get("tags") || "");
    const body = {
      url: String(form.get("url") || "").trim(),
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim() || undefined,
      thumbnailUrl: String(form.get("thumbnailUrl") || "").trim() || undefined,
      tags: tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 12)
        : undefined,
    };

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Could not save website");
      }
      router.push("/websites");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save website");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass space-y-4 p-6">
      <div>
        <label className="gh-label" htmlFor="url">
          Website URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://example.com"
          className="gh-input"
        />
      </div>
      <div>
        <label className="gh-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={2}
          maxLength={120}
          placeholder="My sparkling site"
          className="gh-input"
        />
      </div>
      <div>
        <label className="gh-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          className="gh-input"
          placeholder="What should visitors discover?"
        />
      </div>
      <div>
        <label className="gh-label" htmlFor="thumbnailUrl">
          Thumbnail URL (optional)
        </label>
        <input
          id="thumbnailUrl"
          name="thumbnailUrl"
          type="url"
          className="gh-input"
          placeholder="https://…"
        />
      </div>
      <div>
        <label className="gh-label" htmlFor="tags">
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          name="tags"
          className="gh-input"
          placeholder="art, queer, portfolio"
        />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" className="gh-btn gh-btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Add website"}
      </button>
    </form>
  );
}
