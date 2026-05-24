"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ResetPasswordForm({ next }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [canResetPassword, setCanResetPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        if (!isSupabaseConfigured()) {
          throw new Error("Add your Supabase environment variables before resetting passwords.");
        }

        const supabase = getSupabaseBrowserClient();
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!data.session) {
          throw new Error("This reset link is invalid or has expired. Request a new password reset email.");
        }

        setCanResetPassword(true);
      } catch (caughtError) {
        setCanResetPassword(false);
        setError(caughtError instanceof Error ? caughtError.message : "Unable to verify this reset link.");
      } finally {
        setCheckingSession(false);
      }
    }

    void checkSession();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!canResetPassword) {
        throw new Error("This reset link is invalid or has expired. Request a new password reset email.");
      }

      if (!isSupabaseConfigured()) {
        throw new Error("Add your Supabase environment variables before resetting passwords.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();

      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("reset", "complete");
      if (next) {
        loginUrl.searchParams.set("next", next);
      }

      router.push(`${loginUrl.pathname}${loginUrl.search}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update your password.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="new-password" className="block text-sm font-semibold text-black">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          disabled={checkingSession || !canResetPassword || submitting}
          className="mt-2 w-full rounded-full border border-black/10 px-4 py-3 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-neutral-100"
        />
      </div>
      <div>
        <label htmlFor="confirm-new-password" className="block text-sm font-semibold text-black">
          Confirm new password
        </label>
        <input
          id="confirm-new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat your new password"
          disabled={checkingSession || !canResetPassword || submitting}
          className="mt-2 w-full rounded-full border border-black/10 px-4 py-3 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-neutral-100"
        />
      </div>
      <button
        type="submit"
        disabled={checkingSession || !canResetPassword || submitting}
        className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {checkingSession ? "Checking reset link..." : submitting ? "Updating password..." : "Update password"}
      </button>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
