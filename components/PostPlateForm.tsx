"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { AppLogo } from "@/components/AppLogo";
import { ImageCropModal } from "@/components/ImageCropModal";
import { RestaurantAutocomplete } from "@/components/RestaurantAutocomplete";
import { useAuth } from "@/components/AuthProvider";
import { track } from "@/lib/analytics";
import {
  dailyPlateLimitMessage,
  getLocalDayStartIso,
  getUserTimezone,
  hasUnlimitedPlates,
  isAtDailyPlateLimit,
} from "@/lib/plate-limits";
import { createBrowserClient } from "@/lib/supabase/client";

export function PostPlateForm() {
  const router = useRouter();
  const { getAccessToken, user, loading: authLoading } = useAuth();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [restaurant, setRestaurant] = useState("");
  const [dishName, setDishName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { maximumAge: 600_000, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCheckingLimit(false);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    async function checkDailyLimit() {
      setCheckingLimit(true);
      try {
        const supabase = createBrowserClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();

        if (cancelled) return;

        if (hasUnlimitedPlates(profile?.username)) {
          setDailyLimitReached(false);
          return;
        }

        const dayStart = getLocalDayStartIso(getUserTimezone());
        const { count } = await supabase
          .from("plates")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", dayStart);

        if (cancelled) return;

        setDailyLimitReached(isAtDailyPlateLimit(count ?? 0, profile?.username));
      } finally {
        if (!cancelled) setCheckingLimit(false);
      }
    }

    void checkDailyLimit();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  function clearFileInputs() {
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropSrc(URL.createObjectURL(f));
    clearFileInputs();
  }

  function onCropConfirm(cropped: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    if (preview) URL.revokeObjectURL(preview);
    setCropSrc(null);
    setFile(cropped);
    setPreview(URL.createObjectURL(cropped));
  }

  function onCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || dailyLimitReached) return;

    const restaurantName = restaurant.trim();
    const ordered = dishName.trim();

    if (!restaurantName) {
      setError("Restaurant name is required");
      return;
    }

    if (!ordered) {
      setError("What you ordered is required");
      return;
    }

    if (!user) return;

    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createBrowserClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("plates")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("plates").getPublicUrl(path);

      const res = await fetch("/api/plates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: urlData.publicUrl,
          restaurant_name: restaurantName,
          dish_name: ordered,
          timezone: getUserTimezone(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post");

      void track("plate_posted", { plate_id: data.id as string });

      router.push(`/plate/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    Boolean(file && restaurant.trim() && dishName.trim() && !loading && !dailyLimitReached) &&
    !checkingLimit;

  if (checkingLimit && user) {
    return (
      <div className="app-container px-page pb-page pt-4 sm:pt-6">
        <div className="mb-6 flex items-center gap-3">
          <AppLogo size={44} />
          <h1 className="text-2xl font-bold">Post a plate</h1>
        </div>
        <p className="text-muted text-sm">Checking your posting limit...</p>
      </div>
    );
  }

  if (dailyLimitReached) {
    return (
      <div className="app-container px-page pb-page pt-4 sm:pt-6">
        <div className="mb-6 flex items-center gap-3">
          <AppLogo size={44} />
          <h1 className="text-2xl font-bold">Post a plate</h1>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm">{dailyPlateLimitMessage()}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="app-container px-page pb-page pt-4 sm:pt-6">
      <div className="mb-6 flex items-center gap-3">
        <AppLogo size={44} />
        <h1 className="text-2xl font-bold">Post a plate</h1>
      </div>

      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface">
          {preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
          ) : (
            <AppIcon kind="post" size={80} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={loading}
            className="rounded-2xl border border-border bg-surface py-3 text-sm font-semibold disabled:opacity-50"
          >
            Take photo
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            disabled={loading}
            className="rounded-2xl border border-border bg-surface py-3 text-sm font-semibold disabled:opacity-50"
          >
            Upload photo
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        <RestaurantAutocomplete
          value={restaurant}
          onChange={setRestaurant}
          disabled={loading}
          location={location}
        />
        <input
          value={dishName}
          onChange={(e) => setDishName(e.target.value.slice(0, 80))}
          placeholder="What you ordered"
          required
          maxLength={80}
          disabled={loading}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3"
        />

        {error ? <p className="text-sm text-hot">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-hot py-4 font-bold disabled:opacity-50"
        >
          {loading ? (
            "Posting..."
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              Post it <AppIcon kind="flame" size={22} />
            </span>
          )}
        </button>
      </div>

      {cropSrc ? (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
          shape="square"
          filename="plate.jpg"
        />
      ) : null}
    </form>
  );
}
