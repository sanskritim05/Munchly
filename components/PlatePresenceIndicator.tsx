"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";

const RMP_PRESENCE_ID_KEY = "rmp_presence_id";

function getPresenceId(userId: string | undefined) {
  if (userId) return userId;

  if (typeof window === "undefined") return "anon";

  let id = sessionStorage.getItem(RMP_PRESENCE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(RMP_PRESENCE_ID_KEY, id);
  }
  return id;
}

export function PlatePresenceIndicator({ plateId }: { plateId: string }) {
  const { user } = useAuth();
  const [othersCount, setOthersCount] = useState(0);
  const presenceKey = useMemo(() => getPresenceId(user?.id), [user?.id]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase.channel(`plate:${plateId}`, {
      config: { presence: { key: presenceKey } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const keys = Object.keys(state);
      setOthersCount(Math.max(keys.length - 1, 0));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user?.id ?? "anon",
          viewing_since: Date.now(),
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [plateId, presenceKey, user?.id]);

  if (othersCount < 1) return null;

  const label =
    othersCount === 1
      ? "1 person rating this right now"
      : `${othersCount} people rating this right now`;

  return (
    <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#555]">
      <span className="presence-pulse h-1 w-1 rounded-full bg-[#ff3c00]" />
      {label}
    </p>
  );
}
