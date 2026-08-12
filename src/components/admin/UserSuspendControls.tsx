"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function UserSuspendControls({
  userId,
  isSuspended,
  email,
}: {
  userId: string;
  isSuspended: boolean;
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const reason = isSuspended
      ? undefined
      : window.prompt(`Suspend ${email}? Optional reason:`, "policy") || "suspended";
    startTransition(async () => {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_user_suspended",
          userId,
          suspended: !isSuspended,
          reason,
        }),
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className="gh-btn gh-btn-ghost px-2 py-1 text-xs"
    >
      {isSuspended ? "Unsuspend" : "Suspend"}
    </button>
  );
}
