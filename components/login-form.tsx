"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.2H12Z"
      />
      <path
        fill="#34A853"
        d="M2.5 7.3l3.2 2.3C6.6 7.2 9.1 5.4 12 5.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5c-3.8 0-7.1 2.2-8.7 4.8Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.6 0 4.7-.9 6.3-2.4l-2.9-2.3c-.8.6-1.9 1.1-3.4 1.1-3.7 0-5.1-2.5-5.4-3.8l-3.2 2.5c1.6 3.2 4.9 4.9 8.6 4.9Z"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.9c0-.5-.1-.9-.1-1.2H12v3.9h5.4c-.3 1.2-1 2.1-2 2.8l2.9 2.3c1.7-1.6 2.8-4 2.8-7.8Z"
      />
    </svg>
  );
}

export function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(
    "Use your email and password. Create account first if you have not joined yet.",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  function getRedirectTo() {
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) {
      redirectTo.searchParams.set("next", next);
    }
    return redirectTo.toString();
  }

  async function finishAuthenticatedFlow() {
    const response = await fetch("/auth/bootstrap", { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to finish account setup.");
    }

    router.push(next ?? "/");
    router.refresh();
  }

  async function onOAuth(provider: "google" | "apple") {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Add your Supabase environment variables before signing in.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectTo(),
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start sign in.");
      setSubmitting(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Add your Supabase environment variables before signing in.");
      }

      const supabase = getSupabaseBrowserClient();
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const signupResponse = await fetch("/auth/dev-signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        });

        if (!signupResponse.ok && signupResponse.status !== 403 && signupResponse.status !== 404) {
          const signupPayload = (await signupResponse.json().catch(() => null)) as { error?: string } | null;
          throw new Error(signupPayload?.error ?? "Unable to create your account.");
        }

        if (signupResponse.status === 403 || signupResponse.status === 404) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          });

          if (signUpError) {
            throw signUpError;
          }

          if (!data.session) {
            setMessage("Account created. Disable email confirmation in Supabase or configure SMTP before signing in.");
            return;
          }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        await finishAuthenticatedFlow();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      await finishAuthenticatedFlow();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="inline-flex rounded-full border border-black/10 bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setMessage(null);
            setError(null);
            setNotice("Sign in with the email and password you used when you created your account.");
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            mode === "signin" ? "bg-white text-black shadow-sm" : "text-neutral-500",
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMessage(null);
            setError(null);
            setNotice("Create an account with email and password. In development this signs you in immediately.");
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            mode === "signup" ? "bg-white text-black shadow-sm" : "text-neutral-500",
          )}
        >
          Create account
        </button>
      </div>
      {notice ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm transition-opacity duration-500",
            mode === "signin"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900",
          )}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{notice}</p>
        </div>
      ) : null}
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => void onOAuth("google")}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-100"
        >
          <GoogleMark />
          Continue with Google
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
        <span className="h-px flex-1 bg-black/10" />
        <span>Email and password</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-black">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-full border border-black/10 px-4 py-3 outline-none transition focus:border-black"
        />
        <p className="mt-2 text-xs text-neutral-500">
          {mode === "signup"
            ? "Create your account with email and password."
            : "Sign in with the email and password tied to your member account."}
        </p>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-black">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="mt-2 w-full rounded-full border border-black/10 px-4 py-3 outline-none transition focus:border-black"
        />
      </div>
      {mode === "signup" ? (
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-black">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            className="mt-2 w-full rounded-full border border-black/10 px-4 py-3 outline-none transition focus:border-black"
          />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
      >
        {submitting
          ? mode === "signup"
            ? "Creating account..."
            : "Signing in..."
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
