"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { TierBadge } from "@/components/TierBadge";
import { UserLabel } from "@/components/UserLabel";
import type { ProfileSearchResult } from "@/lib/profile-search";
import { PROFILE_SEARCH_MIN_LENGTH } from "@/lib/profile-search";

export function PeopleSearchPanel({
  autoFocus = false,
  onResultClick,
}: {
  autoFocus?: boolean;
  onResultClick?: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < PROFILE_SEARCH_MIN_LENGTH) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        setResults(data.profiles ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const showResults = query.trim().length >= PROFILE_SEARCH_MIN_LENGTH;

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        Search people
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people by name or @username"
        className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-500 focus:border-hot/50"
        autoComplete="off"
        enterKeyHint="search"
      />

      {showResults ? (
        <div className="mt-3">
          {loading ? (
            <p className="px-1 text-sm text-gray-400">Searching...</p>
          ) : results.length === 0 && searched ? (
            <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-gray-400">
              No people found
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((profile) => (
                <li key={profile.username}>
                  <Link
                    href={`/profile/${profile.username}`}
                    onClick={onResultClick}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-hot/50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-black/20">
                      {profile.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <AppIcon kind="profile" size={40} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <UserLabel
                        username={profile.username}
                        displayName={profile.displayName}
                        verified={profile.verified}
                        nameClassName="font-semibold"
                        handleClassName="text-gray-400"
                      />
                      <div className="mt-1">
                        <TierBadge
                          averageScore={profile.averageScore}
                          totalPlates={profile.totalPlates}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
