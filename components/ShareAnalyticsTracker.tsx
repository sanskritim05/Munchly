"use client";

import { useEffect, useRef } from "react";
import { markSignupSource, track } from "@/lib/analytics";

export function ShareAnalyticsTracker({
  plateId,
  score,
}: {
  plateId: string;
  score: number;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    markSignupSource("share_card");
    void track("share_card_viewed", { plate_id: plateId, score });
    fetch(`/api/plates/${plateId}/share-view`, { method: "POST" }).catch(() => {
      tracked.current = false;
    });
  }, [plateId, score]);

  return null;
}
