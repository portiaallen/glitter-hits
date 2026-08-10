"use client";

import { useState, useTransition } from "react";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/profile";

export function ProfileEditForm({
  name,
  bio,
  countryCode,
}: {
  name: string;
  bio: string;
  countryCode: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result.error) setErr(result.error);
      else setMsg(result.message || "Saved.");
    });
  }

  return (
    <form action={onSubmit} className="gh-glass space-y-4 p-6">
      <h2 className="font-semibold">Edit profile</h2>
      <div>
        <label className="gh-label" htmlFor="name">Display name</label>
        <input id="name" name="name" required defaultValue={name} className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={3} defaultValue={bio} className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="countryCode">Country code (ISO)</label>
        <input
          id="countryCode"
          name="countryCode"
          maxLength={2}
          defaultValue={countryCode}
          className="gh-input"
          placeholder="US"
        />
      </div>
      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
      <button disabled={pending} className="gh-btn gh-btn-primary" type="submit">
        Save profile
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result.error) setErr(result.error);
      else setMsg(result.message || "Password changed.");
    });
  }

  return (
    <form action={onSubmit} className="gh-glass space-y-4 p-6">
      <h2 className="font-semibold">Change password</h2>
      <div>
        <label className="gh-label" htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" name="currentPassword" type="password" required className="gh-input" />
      </div>
      <div>
        <label className="gh-label" htmlFor="newPassword">New password</label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} className="gh-input" />
      </div>
      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
      <button disabled={pending} className="gh-btn gh-btn-ghost" type="submit">
        Update password
      </button>
    </form>
  );
}
