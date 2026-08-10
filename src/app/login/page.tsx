import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to Glitter Hits to surf, earn credits, and promote your sites.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">
          <span className="gh-gradient-text">Glitter Hits</span>
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Sign in to continue discovering and promoting.
        </p>
      </div>
      <div className="gh-glass p-6 sm:p-8">
        <LoginForm />
      </div>
    </div>
  );
}
