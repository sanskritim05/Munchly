"use client";

import { FormEvent, useEffect, useState } from "react";
import { RestaurantAutocomplete } from "@/components/RestaurantAutocomplete";

export function PlateEditForm({
  dishName,
  restaurantName,
  onSave,
  onCancel,
}: {
  dishName: string;
  restaurantName: string;
  onSave: (data: { dish_name: string; restaurant_name: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [dish, setDish] = useState(dishName);
  const [restaurant, setRestaurant] = useState(restaurantName);
  const [saving, setSaving] = useState(false);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dish.trim() || !restaurant.trim()) {
      setError("Restaurant and what you ordered are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({ dish_name: dish.trim(), restaurant_name: restaurant.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-border bg-surface p-4">
      <h3 className="font-bold">Edit plate</h3>
      <div>
        <label className="mb-1 block text-sm text-gray-400">What you ordered</label>
        <input
          value={dish}
          onChange={(e) => setDish(e.target.value.slice(0, 80))}
          placeholder="What you ordered"
          maxLength={80}
          disabled={saving}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-400">Restaurant</label>
        <RestaurantAutocomplete
          value={restaurant}
          onChange={setRestaurant}
          disabled={saving}
          location={location}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-full bg-hot py-2 font-bold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-full border border-border py-2 font-bold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
