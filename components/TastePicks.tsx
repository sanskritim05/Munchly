"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { useAuth } from "@/components/AuthProvider";
import { RECOMMENDATION_COUNT } from "@/lib/recommendations";
import { createBrowserClient } from "@/lib/supabase/client";

interface FoodRecommendation {
  restaurant: string;
  dish: string;
  reason: string;
}

interface SavedTastePick extends FoodRecommendation {
  id: string;
  created_at: string;
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
  return `platecheck-taste-picks:v4:${userId}`;
}

function savedPickKey(restaurant: string, dish: string) {
  return `${restaurant.trim().toLowerCase()}|${dish.trim().toLowerCase()}`;
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

function PickCard({
  restaurant,
  dish,
  reason,
  saved,
  saving,
  onToggleSave,
  onRemove,
}: {
  restaurant: string;
  dish: string;
  reason: string;
  saved: boolean;
  saving?: boolean;
  onToggleSave?: () => void;
  onRemove?: () => void;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{restaurant}</p>
          <p className="mt-1 text-sm text-gray-200">
            Try: <span className="font-semibold text-hot">{dish}</span>
          </p>
          <p className="mt-2 break-words text-xs leading-relaxed text-gray-400">{reason}</p>
        </div>
        {onToggleSave ? (
          <button
            type="button"
            onClick={onToggleSave}
            disabled={saving}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
              saved
                ? "border-hot/40 bg-hot/10 text-hot"
                : "border-border text-gray-300 hover:border-hot/40 hover:text-hot"
            }`}
          >
            {saving ? "..." : saved ? "Saved" : "Save"}
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={saving}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-gray-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
          >
            {saving ? "..." : "Remove"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function TastePicks() {
  const { user, getAccessToken, loading: authLoading } = useAuth();
  const [plateCount, setPlateCount] = useState<number | null>(null);
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [saved, setSaved] = useState<SavedTastePick[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
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
      if (!user) return;

      writeTastePicksCache(user.id, {
        plateCount: plateCount ?? 0,
        data: next,
        locationEnabled: nextLocationEnabled,
        coords: nextCoords,
      });
    },
    [user, plateCount]
  );

  const loadSaved = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setSaved([]);
      setSavedLoading(false);
      return;
    }

    setSavedLoading(true);

    try {
      const res = await fetch("/api/taste-picks/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load saved picks");

      setSaved(json.saved ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved picks");
    } finally {
      setSavedLoading(false);
    }
  }, [getAccessToken]);

  const requestRecommendations = useCallback(
    async (
      withLocation: boolean,
      position: { lat: number; lng: number } | null,
      options?: {
        refresh?: boolean;
        excludeRestaurants?: string[];
        excludeDishes?: string[];
      }
    ): Promise<RecommendationResult> => {
      const token = getAccessToken();
      if (!token) throw new Error("Not signed in");

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

      if (options?.refresh) {
        body.refresh = true;
        body.exclude_restaurants = options.excludeRestaurants ?? [];
        body.exclude_dishes = options.excludeDishes ?? [];
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

      return json as RecommendationResult;
    },
    [getAccessToken]
  );

  const fillRecommendations = useCallback(
    async (
      remaining: FoodRecommendation[],
      savedPicks: SavedTastePick[]
    ): Promise<FoodRecommendation[]> => {
      const needed = RECOMMENDATION_COUNT - remaining.length;
      if (needed <= 0) return remaining.slice(0, RECOMMENDATION_COUNT);

      const excludeRestaurants = [
        ...remaining.map((rec) => rec.restaurant),
        ...savedPicks.map((pick) => pick.restaurant),
      ];
      const excludeDishes = [
        ...remaining.map((rec) => rec.dish),
        ...savedPicks.map((pick) => pick.dish),
      ];

      const result = await requestRecommendations(locationEnabled, coords, {
        refresh: true,
        excludeRestaurants,
        excludeDishes,
      });

      const taken = new Set(remaining.map((rec) => savedPickKey(rec.restaurant, rec.dish)));
      const additions: FoodRecommendation[] = [];

      for (const rec of result.recommendations) {
        const key = savedPickKey(rec.restaurant, rec.dish);
        if (taken.has(key)) continue;
        taken.add(key);
        additions.push(rec);
        if (additions.length >= needed) break;
      }

      return [...remaining, ...additions].slice(0, RECOMMENDATION_COUNT);
    },
    [coords, locationEnabled, requestRecommendations]
  );

  const fetchRecommendations = useCallback(
    async (
      withLocation: boolean,
      position?: { lat: number; lng: number },
      refresh = false,
      current?: FoodRecommendation[]
    ) => {
      setLoading(true);
      setError("");

      try {
        const next = await requestRecommendations(
          withLocation,
          withLocation ? (position ?? coords) : null,
          refresh && current?.length
            ? {
                refresh: true,
                excludeRestaurants: current.map((rec) => rec.restaurant),
                excludeDishes: current.map((rec) => rec.dish),
              }
            : undefined
        );
        setData(next);
        persistRecommendations(next, withLocation, withLocation ? (position ?? coords) : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [coords, persistRecommendations, requestRecommendations]
  );

  const saveRecommendation = useCallback(
    async (rec: FoodRecommendation) => {
      const token = getAccessToken();
      if (!token || !data) return;

      const key = savedPickKey(rec.restaurant, rec.dish);
      setSavingKey(key);

      try {
        const res = await fetch("/api/taste-picks/saved", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rec),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not save pick");

        const savedPick = json.saved as SavedTastePick;
        const nextSaved = [savedPick, ...saved.filter((item) => item.id !== savedPick.id)];

        setSaved(nextSaved);

        const remaining = data.recommendations.filter(
          (item) => savedPickKey(item.restaurant, item.dish) !== key
        );
        const filled = await fillRecommendations(remaining, nextSaved);
        const nextData = { ...data, recommendations: filled };

        setData(nextData);
        persistRecommendations(nextData, locationEnabled, coords);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save pick");
      } finally {
        setSavingKey(null);
      }
    },
    [coords, data, fillRecommendations, getAccessToken, locationEnabled, persistRecommendations, saved]
  );

  const removeSaved = useCallback(
    async (id: string, restaurant: string, dish: string) => {
      const token = getAccessToken();
      if (!token) return;

      const key = savedPickKey(restaurant, dish);
      setSavingKey(key);

      try {
        const res = await fetch(`/api/taste-picks/saved?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not remove saved pick");

        setSaved((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not remove saved pick");
      } finally {
        setSavingKey(null);
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    if (authLoading || !user) return;

    const userId = user.id;
    let cancelled = false;

    async function loadPlateCount() {
      const supabase = createBrowserClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_plates")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled) {
        setPlateCount(profile?.total_plates ?? 0);
      }
    }

    void loadPlateCount();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadSaved();
  }, [authLoading, loadSaved]);

  useEffect(() => {
    if (savedLoading || !data || !hydrated || plateCount === 0) return;

    const savedKeys = new Set(saved.map((pick) => savedPickKey(pick.restaurant, pick.dish)));
    const remaining = data.recommendations.filter(
      (rec) => !savedKeys.has(savedPickKey(rec.restaurant, rec.dish))
    );

    if (remaining.length === data.recommendations.length) return;

    let cancelled = false;

    void (async () => {
      try {
        const filled = await fillRecommendations(remaining, saved);
        if (cancelled) return;

        const nextData = { ...data, recommendations: filled };
        setData(nextData);
        persistRecommendations(nextData, locationEnabled, coords);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not refresh picks");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    coords,
    data,
    fillRecommendations,
    hydrated,
    locationEnabled,
    persistRecommendations,
    plateCount,
    saved,
    savedLoading,
  ]);

  useEffect(() => {
    if (authLoading || !user || plateCount === null) return;

    if (plateCount === 0) {
      setHydrated(true);
      loadedForRef.current = null;
      return;
    }

    const loadKey = `${user.id}:${plateCount}`;
    if (loadedForRef.current === loadKey) return;

    const cached = readTastePicksCache(user.id, plateCount);
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
  }, [authLoading, user, plateCount, fetchRecommendations]);

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

  if (authLoading || plateCount === null) {
    return (
      <div className="flex min-h-page items-center justify-center">
        <p className="text-gray-400">Loading picks...</p>
      </div>
    );
  }

  return (
    <div className="app-container px-page pb-page pt-4 sm:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AppIcon kind="picks" size={28} className="h-7 w-7" />
            <h1 className="text-2xl font-bold sm:text-3xl">Taste picks</h1>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Suggestions for restaurants and dishes based on what you&apos;ve posted.
          </p>
        </div>
        {plateCount > 0 ? (
          locationEnabled ? (
            <button
              type="button"
              onClick={disableLocation}
              disabled={loading}
              className="shrink-0 rounded-full border border-hot/40 px-3 py-1.5 text-xs font-semibold text-hot disabled:opacity-50"
            >
              Near you on
            </button>
          ) : (
            <button
              type="button"
              onClick={enableLocation}
              disabled={loading}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-gray-300 disabled:opacity-50"
            >
              Use location
            </button>
          )
        ) : null}
      </div>

      {plateCount === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-gray-300">Post a few plates to unlock taste picks.</p>
          <p className="mt-2 text-sm text-gray-500">
            Add a restaurant and what you ordered so we can learn your taste.
          </p>
          <Link
            href="/post"
            className="mt-5 inline-block rounded-full bg-hot px-6 py-3 text-sm font-bold"
          >
            Post a plate
          </Link>
        </div>
      ) : null}

      {!hydrated || loading ? (
        <p className="mt-8 text-sm text-gray-400">Finding picks for you...</p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-hot">{error}</p> : null}

      {data && hydrated && !loading && plateCount > 0 ? (
        <section className="mt-8">
          {data.mode === "nearby" && data.location_label ? (
            <p className="text-xs text-gray-500">Exploring near {data.location_label}</p>
          ) : null}

          <ul className={`space-y-3 ${data.mode === "nearby" && data.location_label ? "mt-4" : ""}`}>
            {data.recommendations.map((rec) => {
              const key = savedPickKey(rec.restaurant, rec.dish);

              return (
                <PickCard
                  key={`${rec.restaurant}-${rec.dish}`}
                  restaurant={rec.restaurant}
                  dish={rec.dish}
                  reason={rec.reason}
                  saved={false}
                  saving={savingKey === key}
                  onToggleSave={() => {
                    void saveRecommendation(rec);
                  }}
                />
              );
            })}
          </ul>

          {locationEnabled && coords ? (
            <button
              type="button"
              onClick={() => fetchRecommendations(true, coords, true, data.recommendations)}
              disabled={loading}
              className="mt-6 text-sm text-gray-400 hover:text-hot"
            >
              Refresh nearby picks
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fetchRecommendations(false, undefined, true, data.recommendations)}
              disabled={loading}
              className="mt-6 text-sm text-gray-400 hover:text-hot"
            >
              Refresh taste picks
            </button>
          )}
        </section>
      ) : null}

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold">Saved</h2>
        <p className="mt-1 text-sm text-gray-400">
        </p>

        {savedLoading ? (
          <p className="mt-4 text-sm text-gray-400">Loading saved picks...</p>
        ) : saved.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-sm text-gray-500">
            Nothing saved yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {saved.map((item) => {
              const key = savedPickKey(item.restaurant, item.dish);
              return (
                <PickCard
                  key={item.id}
                  restaurant={item.restaurant}
                  dish={item.dish}
                  reason={item.reason}
                  saved
                  saving={savingKey === key}
                  onRemove={() => {
                    void removeSaved(item.id, item.restaurant, item.dish);
                  }}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
