"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";
import { LandingCarouselBackdrop } from "@/components/LandingCarouselBackdrop";
import { useAuth } from "@/components/AuthProvider";
import { getPostAuthPath, resolveAuthNext } from "@/lib/auth-redirect";
import { createBrowserClient } from "@/lib/supabase/client";
import type { LandingCarouselPlate } from "@/lib/landing-carousel";

export function UsernameSignInForm({ plates }: { plates: LandingCarouselPlate[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInUsername } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = resolveAuthNext(searchParams.get("next"));
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
    <LandingCarouselBackdrop
      initialPlates={plates}
      contentClassName="w-full max-w-md pb-8 pt-8 text-left sm:pt-12"
    >
      <AppLogo size={140} priority className="mx-auto" />
      <h1 className="mt-6 text-center text-4xl font-bold tracking-tight">Welcome back</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
            <div>
              <label htmlFor="signin-username" className="mb-1 block text-sm text-gray-400">
                Username
              </label>
              <input
                id="signin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your username"
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
                placeholder="your password"
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
    </LandingCarouselBackdrop>
  );
}
