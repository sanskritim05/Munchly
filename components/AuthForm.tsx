"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppIcon } from "@/components/AppIcon";
import { useAuth } from "@/components/AuthProvider";
import { getPostAuthPath } from "@/lib/auth-redirect";
import { createBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInEmail, signUpEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") || "/swipe";
  const nextQuery = next !== "/swipe" ? `?next=${encodeURIComponent(next)}` : "";
  const isSignIn = mode === "signin";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isSignIn
      ? await signInEmail(email, password)
      : await signUpEmail(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Check your email to confirm your account, then sign in.");
      return;
    }

    const path = await getPostAuthPath(supabase, user.id, user.is_anonymous ?? false, next);
    router.push(path);
  }

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 pb-8 pt-12 text-center">
        <div className="absolute inset-0 opacity-30">
          <div className="animate-pulse bg-gradient-to-br from-hot/40 via-purple/20 to-black" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <h1 className="text-5xl font-bold tracking-tight">Is your food a 10?</h1>
          <p className="mt-4 text-xl text-gray-400">
            {isSignIn ? "Sign in to rate plates and post your own." : "Create an account to get started."}
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 text-left"
          >
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-black px-4 py-3"
            />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-border bg-black px-4 py-3"
            />

            {error ? <p className="text-sm text-hot">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-hot py-4 text-lg font-bold shadow-lg shadow-hot/30 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Please wait..." : isSignIn ? (
                <span className="inline-flex items-center justify-center gap-2">
                  Sign in <AppIcon kind="flame" size={24} />
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-400">
            {isSignIn ? (
              <>
                No account?{" "}
                <Link href={`/signup${nextQuery}`} className="text-hot hover:underline">
                  Create account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href={`/signin${nextQuery}`} className="text-hot hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
