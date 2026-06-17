"use client";

import { useEffect, useRef, useState } from "react";

interface RestaurantSuggestion {
  name: string;
  detail?: string;
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;

  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-hot">
        {text.slice(index, index + q.length)}
      </span>
      {text.slice(index + q.length)}
    </>
  );
}

export function RestaurantAutocomplete({
  value,
  onChange,
  disabled = false,
  location,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  location?: { lat: number; lng: number } | null;
}) {
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (location) {
          params.set("lat", String(location.lat));
          params.set("lng", String(location.lng));
        }

        const res = await fetch(`/api/restaurants/search?${params.toString()}`);
        const data = await res.json();
        const list: RestaurantSuggestion[] = data.restaurants ?? [];
        setSuggestions(list);
        setOpen(list.length > 0);
        setActiveIndex(list.length > 0 ? 0 : -1);
      } catch {
        setSuggestions([]);
        setOpen(false);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [value, location]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectSuggestion(name: string) {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].name);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 80))}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Restaurant"
        required
        maxLength={80}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="restaurant-suggestions"
        className="w-full rounded-2xl border border-border bg-surface px-4 py-3"
      />

      {open && suggestions.length > 0 ? (
        <ul
          id="restaurant-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-border bg-surface py-1 shadow-lg"
        >
          {suggestions.map((item, index) => (
            <li key={`${item.name}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(item.name)}
                className={`w-full px-4 py-2.5 text-left ${
                  index === activeIndex ? "bg-hot/10" : "hover:bg-hot/10"
                }`}
              >
                <span className="block text-sm">
                  {highlightMatch(item.name, value)}
                </span>
                {item.detail ? (
                  <span className="block truncate text-xs text-gray-500">{item.detail}</span>
                ) : null}
              </button>
            </li>
          ))}
          <li className="border-t border-border px-4 py-2 text-[10px] text-gray-500">
            Places via OpenStreetMap
          </li>
        </ul>
      ) : null}

      {loading && value.trim().length > 0 ? (
        <p className="mt-1 text-xs text-gray-500">Finding restaurants...</p>
      ) : null}
    </div>
  );
}
