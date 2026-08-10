import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">
          <span className="gh-gradient-text">Glitter Hits</span>
        </p>
        <h1 className="mt-3 text-xl font-semibold">Reset your password</h1>
      </div>
      <div className="gh-glass p-6 sm:p-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
