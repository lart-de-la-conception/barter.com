import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const { next, error, reset } = await searchParams;
  const resetMessage = reset === "complete" ? "Your password has been updated. Sign in with your new password." : undefined;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.28em] text-neutral-500">MEMBERS ONLY</p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-black">
            Sign in or create an account to message sellers, save favorites, and manage your closet.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600">
            We are a memberes-only club. This is to establish trust between members and ensure that
            every transaction is fair. 
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black">
              Browse listings
            </Link>
          </div>
        </div>
        <div className="rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-black">Sign in or create your account</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Use the same email and password every time so your profile, favorites, and trades stay with you.
          </p>
          <div className="mt-6">
            <LoginForm next={next} initialError={error} initialMessage={resetMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}
