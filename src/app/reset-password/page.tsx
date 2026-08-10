import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = params.token || "";
  const email = params.email || "";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">
          <span className="gh-gradient-text">Glitter Hits</span>
        </p>
        <h1 className="mt-3 text-xl font-semibold">Choose a new password</h1>
      </div>
      <div className="gh-glass p-6 sm:p-8">
        {token && email ? (
          <ResetPasswordForm email={email} token={token} />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Missing reset token. Request a new link from the forgot password page.
          </p>
        )}
      </div>
    </div>
  );
}
