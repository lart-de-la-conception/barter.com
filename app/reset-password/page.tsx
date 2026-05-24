import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.28em] text-neutral-500">PASSWORD RESET</p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-black">
            Choose a new password for your Barter account.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600">
            Password reset links expire quickly. If this one no longer works, request another from the sign in page.
          </p>
          <Link href="/login" className="inline-flex rounded-full border border-black px-5 py-3 text-sm font-semibold text-black">
            Back to sign in
          </Link>
        </div>
        <div className="rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-black">Update password</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Enter a new password below. After it is saved, you&apos;ll sign in again with the new password.
          </p>
          <div className="mt-6">
            <ResetPasswordForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
