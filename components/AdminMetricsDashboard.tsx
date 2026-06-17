"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { loadAdminMetrics } from "@/app/admin/metrics/actions";
import type { AdminMetrics } from "@/lib/admin-metrics";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#f0ede6]">{value}</p>
      {hint ? <p className="mt-2 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function AdminSignInForm() {
  const { signInEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signInEmail(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 w-full max-w-sm space-y-3 text-left">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Admin email"
        required
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
      />
      {error ? <p className="text-sm text-hot">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-hot py-3 text-sm font-bold disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export function AdminMetricsDashboard() {
  const { user, session, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (authLoading) return;

      const token = session?.access_token ?? null;
      const userKey = `${user?.id ?? "none"}:${user?.email ?? "none"}`;

      if (!token || !user?.email) {
        if (!cancelled) {
          setMetrics(null);
          loadedFor.current = null;
          setStatus("forbidden");
        }
        return;
      }

      if (loadedFor.current === userKey) {
        if (!cancelled) setStatus("ready");
        return;
      }

      if (!cancelled) setStatus("loading");

      try {
        const data = await loadAdminMetrics(token);
        if (cancelled) return;

        if (!data) {
          setMetrics(null);
          loadedFor.current = null;
          setStatus("forbidden");
          return;
        }

        setMetrics(data);
        loadedFor.current = userKey;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Failed to load metrics");
        setStatus("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session?.access_token, user?.id, user?.email]);

  if (authLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-gray-400">Loading metrics...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <p className="text-hot">Could not load metrics</p>
        <p className="max-w-sm text-sm text-gray-400">{errorMessage}</p>
        <p className="max-w-sm text-xs text-gray-500">
          Make sure you ran <code className="text-gray-300">supabase/events-migration.sql</code> in
          the Supabase SQL Editor.
        </p>
        <Link href="/swipe" className="text-hot">
          Back to feed
        </Link>
      </div>
    );
  }

  if (status === "forbidden" || !metrics) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-10 text-center">
        <p className="text-lg font-bold">Admin sign-in required</p>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          {user?.email
            ? `Signed in as ${user.email}, but that doesn't match ADMIN_EMAIL in your .env.`
            : "You're on a guest session. Sign in with the email set as ADMIN_EMAIL."}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Create this user in Supabase → Authentication → Users if needed.
        </p>
        <AdminSignInForm />
        <Link href="/swipe" className="mt-6 text-sm text-hot">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Metrics</h1>
        <p className="mt-1 text-sm text-gray-400">YC-ready numbers from Supabase events.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Share card views (this week)"
          value={metrics.shareCardViewsThisWeek.toLocaleString()}
        />
        <StatCard
          label="Share → signup conversion"
          value={formatPercent(metrics.shareToSignupRate)}
          hint={`${metrics.shareSignups} signups / ${metrics.shareCardViewsTotal} share views`}
        />
        <StatCard
          label="D1 retention"
          value={formatPercent(metrics.d1Retention)}
          hint={`${metrics.signupCount} completed signups`}
        />
        <StatCard
          label="D7 retention"
          value={formatPercent(metrics.d7Retention)}
          hint="Users with any event on day 7 after signup"
        />
        <StatCard
          label="Plates posted (this week)"
          value={metrics.platesPostedThisWeek.toLocaleString()}
        />
        <StatCard
          label="Avg swipes per session"
          value={metrics.averageSwipesPerSession.toFixed(1)}
          hint={`${metrics.swipeSessionsThisWeek} swipe sessions this week`}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">Top shared plates</h2>
        <ul className="mt-4 space-y-3">
          {metrics.topSharedPlates.length === 0 ? (
            <li className="text-sm text-gray-500">No share views yet.</li>
          ) : (
            metrics.topSharedPlates.map((plate, index) => (
              <li
                key={plate.id}
                className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    #{index + 1} {plate.dish_name ?? "Untitled plate"}
                  </p>
                  <p className="text-xs text-gray-500">Score {plate.score.toFixed(1)}</p>
                </div>
                <p className="text-sm font-semibold text-hot">
                  {plate.share_view_count.toLocaleString()} share views
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
