"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

export function AnalyticsOnce({
  eventName,
  properties,
}: {
  eventName: string;
  properties?: Record<string, unknown>;
}) {
  const fired = useRef(false);
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void track(eventName, propertiesRef.current);
  }, [eventName]);

  return null;
}
