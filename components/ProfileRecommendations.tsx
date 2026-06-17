"use client";

import { useCallback, useEffect, useState } from "react";
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

export function ProfileRecommendations({
  profileUserId,
  plateCount,
}: {
  profileUserId: string;
  plateCount: number;
}) {
  const { user, getAccessToken } = useAuth();
  const isOwner = user?.id === profileUserId;
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchRecommendations = useCallback(
    async (withLocation: boolean, position?: { lat: number; lng: number }) => {
      const token = getAccessToken();
      if (!token) return;

      setLoading(true);
      setError("");

      try {
        const body: { lat?: number; lng?: number } = {};
        if (withLocation && position) {
          body.lat = position.lat;
          body.lng = position.lng;
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

        setData(json as RecommendationResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    if (!isOwner || plateCount === 0) return;
    fetchRecommendations(false);
  }, [isOwner, plateCount, fetchRecommendations]);

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
            For You
          </h2>
          {plateCount > 0 ? (
            <p className="mt-1 text-sm text-gray-400">Based on what you post and where you eat.</p>
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

      {loading ? (
        <p className="mt-4 text-sm text-gray-400">Finding picks for you...</p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-hot">{error}</p> : null}

      {data && !loading ? (
        <>
          <p className="mt-4 text-sm text-gray-300">{data.taste_summary}</p>
          <p className="mt-1 text-xs text-gray-500">
            {data.mode === "nearby" && data.location_label
              ? `Exploring near ${data.location_label}`
              : "Matched to your taste"}
          </p>

          <ul className="mt-4 space-y-3">
            {data.recommendations.map((rec) => (
              <li
                key={`${rec.restaurant}-${rec.dish}`}
                className="rounded-xl border border-border bg-black/40 p-3"
              >
                <p className="font-bold">{rec.restaurant}</p>
                <p className="text-sm text-hot">{rec.dish}</p>
                <p className="mt-1 text-xs text-gray-400">{rec.reason}</p>
              </li>
            ))}
          </ul>

          {locationEnabled && coords ? (
            <button
              type="button"
              onClick={() => fetchRecommendations(true, coords)}
              disabled={loading}
              className="mt-4 text-xs text-gray-400 hover:text-hot"
            >
              Refresh nearby picks
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fetchRecommendations(false)}
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
