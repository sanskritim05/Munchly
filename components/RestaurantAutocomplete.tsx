"use client";

import { useEffect, useRef, useState } from "react";

export function RestaurantAutocomplete({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurants/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const list: string[] = data.restaurants ?? [];
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [value]);

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
        placeholder="Restaurant"
        required
        maxLength={80}
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-2xl border border-border bg-surface px-4 py-3"
      />

      {open && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-border bg-surface py-1 shadow-lg">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(name)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-hot/10"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {loading && value.trim().length > 0 ? (
        <p className="mt-1 text-xs text-gray-500">Searching...</p>
      ) : null}
    </div>
  );
}
