"use client";

import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInGuest: () => Promise<{ error?: string }>;
  signInUsername: (username: string, password: string) => Promise<{ error?: string }>;
  applySession: (accessToken: string, refreshToken: string) => Promise<{ error?: string }>;
  signInEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signInGuest = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const body = await res.json();

      if (!res.ok) {
        return { error: body.error ?? "Could not start guest session" };
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      });

      if (error) return { error: error.message };
      if (data.session) setSession(data.session);
      return {};
    } catch {
      return { error: "Could not connect. Check your network and try again." };
    }
  }, [supabase]);

  const applySession = useCallback(
    async (accessToken: string, refreshToken: string) => {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) return { error: error.message };
        if (data.session) setSession(data.session);
        return {};
      } catch {
        return { error: "Could not connect. Check your network and try again." };
      }
    },
    [supabase]
  );

  const signInUsername = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const body = await res.json();

        if (!res.ok) {
          return { error: body.error ?? "Could not sign in" };
        }

        return applySession(body.access_token, body.refresh_token);
      } catch {
        return { error: "Could not connect. Check your network and try again." };
      }
    },
    [applySession]
  );

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    [supabase]
  );

  const signUpEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      return error ? { error: error.message } : {};
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    signInGuest,
    signInUsername,
    applySession,
    signInEmail,
    signUpEmail,
    signOut,
    getAccessToken: () => session?.access_token ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
