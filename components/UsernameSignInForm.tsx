"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/components/AuthProvider";
import { getPostAuthPath } from "@/lib/auth-redirect";
import { createBrowserClient } from "@/lib/supabase/client";

export function UsernameSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInUsername } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") || "/swipe";
  const nextQuery = next !== "/swipe" ? `?next=${encodeURIComponent(next)}` : "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signInUsername(username, password);
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
      setError("Could not sign in. Try again.");
      return;
    }

    const path = await getPostAuthPath(supabase, user.id, false, next);
    router.push(path);
  }

  return (
    <div className="min-h-page">
      <div className="relative flex min-h-page flex-col items-center justify-center overflow-hidden px-page pb-8 pt-8 text-center sm:pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="animate-pulse bg-gradient-to-br from-hot/40 via-purple/20 to-black" />
        </div>

        <div className="relative z-10 w-full max-w-md text-left">
          <AppLogo size={140} priority className="mx-auto" />
          <h1 className="mt-6 text-center text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-center text-gray-400">Sign in with your username and password.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
            <div>
              <label htmlFor="signin-username" className="mb-1 block text-sm text-gray-400">
                Username
              </label>
              <input
                id="signin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                required
                autoComplete="username"
                maxLength={20}
                className="w-full rounded-xl border border-border bg-black px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="signin-password" className="mb-1 block text-sm text-gray-400">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
                minLength={6}
                className="w-full rounded-xl border border-border bg-black px-4 py-3"
              />
            </div>

            {error ? <p className="text-sm text-hot">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-hot py-4 text-lg font-bold disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            New here?{" "}
            <Link href={`/get-started${nextQuery}`} className="text-hot hover:underline">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
