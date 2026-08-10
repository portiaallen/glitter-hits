import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Join free",
  description: "Create your Glitter Hits account and start earning promotional credits.",
};

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">
          <span className="gh-gradient-text">Glitter Hits</span>
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Get Seen. Get Hits. Get Glitter.
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Join free — earn credits by discovering sites, then promote yours.
        </p>
      </div>
      <div className="gh-glass p-6 sm:p-8">
        <SignupForm referralCode={ref} />
      </div>
    </div>
  );
}
