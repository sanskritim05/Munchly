"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { useAuth } from "@/components/AuthProvider";

interface FoodRecommendation {
  restaurant: string;
  dish: string;
  reason: string;
}

interface RecommendationResult {
  mode: "nearby" | "taste";
  taste_summary: string;
  location_label: string | null;
  recommendations: FoodRecommendation[];
}

interface TastePicksCache {
  plateCount: number;
  data: RecommendationResult;
  locationEnabled: boolean;
  coords: { lat: number; lng: number } | null;
}

function tastePicksCacheKey(userId: string) {
  return `platecheck-taste-picks:${userId}`;
}

function readTastePicksCache(userId: string, plateCount: number): TastePicksCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(tastePicksCacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TastePicksCache;
    if (parsed.plateCount !== plateCount || !parsed.data?.recommendations?.length) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeTastePicksCache(userId: string, cache: TastePicksCache) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(tastePicksCacheKey(userId), JSON.stringify(cache));
  } catch {
    // Ignore quota or private-mode storage errors.
  }
}

export function ProfileRecommendations({
  profileUserId,
  plateCount,
}: {
  profileUserId: string;
  plateCount: number;
}) {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const isOwner = user?.id === profileUserId;
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const loadedForRef = useRef<string | null>(null);

  const persistRecommendations = useCallback(
    (
      next: RecommendationResult,
      nextLocationEnabled: boolean,
      nextCoords: { lat: number; lng: number } | null
    ) => {
      writeTastePicksCache(profileUserId, {
        plateCount,
        data: next,
        locationEnabled: nextLocationEnabled,
        coords: nextCoords,
      });
    },
    [profileUserId, plateCount]
  );

  const fetchRecommendations = useCallback(
    async (
      withLocation: boolean,
      position?: { lat: number; lng: number },
      refresh = false,
      current?: FoodRecommendation[]
    ) => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const body: {
          lat?: number;
          lng?: number;
          refresh?: boolean;
          exclude_restaurants?: string[];
          exclude_dishes?: string[];
        } = {};

        if (withLocation && position) {
          body.lat = position.lat;
          body.lng = position.lng;
        }

        if (refresh && current?.length) {
          body.refresh = true;
          body.exclude_restaurants = current.map((rec) => rec.restaurant);
          body.exclude_dishes = current.map((rec) => rec.dish);
        }

        const res = await fetch("/api/profile/recommendations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load recommendations");

        const next = json as RecommendationResult;
        setData(next);
        persistRecommendations(next, withLocation, withLocation ? (position ?? coords) : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [coords, getAccessToken, persistRecommendations]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isOwner || plateCount === 0) {
      setHydrated(true);
      loadedForRef.current = null;
      return;
    }

    const loadKey = `${profileUserId}:${plateCount}`;
    if (loadedForRef.current === loadKey) return;

    const cached = readTastePicksCache(profileUserId, plateCount);
    if (cached) {
      setData(cached.data);
      setLocationEnabled(cached.locationEnabled);
      setCoords(cached.coords);
      setHydrated(true);
      loadedForRef.current = loadKey;
      return;
    }

    loadedForRef.current = loadKey;
    setHydrated(true);
    void fetchRecommendations(false);
  }, [authLoading, isOwner, plateCount, profileUserId, fetchRecommendations]);

  function enableLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(position);
        setLocationEnabled(true);
        fetchRecommendations(true, position);
      },
      () => {
        setLoading(false);
        setError("Location permission denied. Showing taste-based picks instead.");
        setLocationEnabled(false);
        fetchRecommendations(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function disableLocation() {
    setLocationEnabled(false);
    setCoords(null);
    fetchRecommendations(false);
  }

  if (!isOwner) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden="true">
              <AppIcon kind="flame" size={20} />
            </span>
            Taste picks
          </h2>
          {plateCount > 0 ? (
            <p className="mt-1 text-sm text-gray-400">
              Three new restaurants and dishes to try based on what you&apos;ve posted.
            </p>
          ) : null}
        </div>
        {plateCount > 0 ? (
          locationEnabled ? (
            <button
              type="button"
              onClick={disableLocation}
              disabled={loading}
              className="shrink-0 rounded-full border border-hot/40 px-3 py-1 text-xs font-semibold text-hot disabled:opacity-50"
            >
              Near you on
            </button>
          ) : (
            <button
              type="button"
              onClick={enableLocation}
              disabled={loading}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold text-gray-300 disabled:opacity-50"
            >
              Use location
            </button>
          )
        ) : null}
      </div>

      {plateCount === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          Post a few plates with a restaurant and what you ordered to unlock recommendations.
        </p>
      ) : null}

      {!hydrated || loading ? (
        <p className="mt-4 text-sm text-gray-400">Finding picks for you...</p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-hot">{error}</p> : null}

      {data && hydrated && !loading ? (
        <>
          <p className="mt-4 text-sm text-gray-300">{data.taste_summary}</p>
          <p className="mt-1 text-xs text-gray-500">
            {data.mode === "nearby" && data.location_label
              ? `Exploring near ${data.location_label}`
              : "Based on what you've posted"}
          </p>

          <ul className="mt-4 space-y-3">
            {data.recommendations.map((rec) => (
              <li
                key={`${rec.restaurant}-${rec.dish}`}
                className="rounded-xl border border-border bg-black/40 p-3"
              >
                <p className="font-bold">{rec.restaurant}</p>
                <p className="mt-1 text-sm text-gray-200">
                  Try: <span className="font-semibold text-hot">{rec.dish}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">{rec.reason}</p>
              </li>
            ))}
          </ul>

          {locationEnabled && coords ? (
            <button
              type="button"
              onClick={() => fetchRecommendations(true, coords, true, data.recommendations)}
              disabled={loading}
              className="mt-4 text-xs text-gray-400 hover:text-hot"
            >
              Refresh nearby picks
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fetchRecommendations(false, undefined, true, data.recommendations)}
              disabled={loading}
              className="mt-4 text-xs text-gray-400 hover:text-hot"
            >
              Refresh taste picks
            </button>
          )}
        </>
      ) : null}
    </section>
  );
}
