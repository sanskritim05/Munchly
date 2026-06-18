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
import { createBrowserClient } from "@/lib/supabase/client";

export function PostPlateForm() {
  const router = useRouter();
  const { getAccessToken, user, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [restaurant, setRestaurant] = useState("");
  const [dishName, setDishName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropSrc(URL.createObjectURL(f));
    if (fileRef.current) fileRef.current.value = "";
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
    if (!file) return;

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

  const canSubmit = Boolean(file && restaurant.trim() && dishName.trim() && !loading);

  return (
    <form onSubmit={onSubmit} className="app-container px-page pb-page pt-4 sm:pt-6">
      <div className="mb-6 flex items-center gap-3">
        <AppLogo size={44} />
        <h1 className="text-2xl font-bold">Post a plate</h1>
      </div>

      <div className="mx-auto w-full max-w-sm space-y-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface"
        >
          {preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
          ) : (
            <AppIcon kind="post" size={80} />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
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
