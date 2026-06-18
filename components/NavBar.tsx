"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AppIcon, AppIconKind } from "@/components/AppIcon";
import { createBrowserClient } from "@/lib/supabase/client";

const NAV_ICON_SIZE = 24;

const TABS: { href: string; label: string; icon: AppIconKind; match: (path: string) => boolean }[] = [
  { href: "/swipe", label: "Feed", icon: "flame", match: (p) => p.startsWith("/swipe") },
  { href: "/post", label: "Post", icon: "post", match: (p) => p.startsWith("/post") },
  { href: "/leaderboard", label: "Top", icon: "trophy", match: (p) => p.startsWith("/leaderboard") },
];

function NavIcon({ kind }: { kind: AppIconKind }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
      <AppIcon kind={kind} size={NAV_ICON_SIZE} className="h-6 w-6" />
    </span>
  );
}

function NavTab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: AppIconKind;
  active: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`flex min-w-[3.5rem] flex-col items-center gap-1 py-1 text-xs transition-colors ${
        active ? "text-hot" : "text-gray-500"
      }`}
    >
      <NavIcon kind={icon} />
      {label}
    </button>
  );
}

function YouNavIcon({ active, avatarUrl }: { active: boolean; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full ${
          active ? "ring-2 ring-hot ring-offset-1 ring-offset-black" : ""
        }`}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 object-cover"
          unoptimized
        />
      </span>
    );
  }

  return <NavIcon kind="profile" />;
}

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }

    const supabase = createBrowserClient();
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));

    const channel = supabase
      .channel(`nav-avatar-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const next = payload.new as { avatar_url?: string | null };
          setAvatarUrl(next.avatar_url ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const youHref = user ? "/profile/me" : "/get-started?next=/profile/me";
  const youActive = pathname.startsWith("/profile");

  return (
    <nav className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-black/95 backdrop-blur-md">
      <div className="app-container flex w-full items-center justify-around px-page py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map((tab) => (
          <NavTab
            key={tab.href}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            active={tab.match(pathname)}
          />
        ))}
        <button
          type="button"
          onClick={() => router.push(youHref)}
          className={`flex min-w-[3.5rem] flex-col items-center gap-1 py-1 text-xs transition-colors ${
            youActive ? "text-hot" : "text-gray-500"
          }`}
        >
          <YouNavIcon active={youActive} avatarUrl={avatarUrl} />
          You
        </button>
      </div>
    </nav>
  );
}
