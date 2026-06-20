"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPicker } from "@/components/AvatarPicker";
import { AccountSettingsSection } from "@/components/AccountSettingsSection";
import { ThemeSetting } from "@/components/ThemeSetting";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import {
  canChangeIdentity,
  formatIdentityUnlockDate,
} from "@/lib/profile-identity";
import { getUsernameError, normalizeUsername, USERNAME_RE } from "@/lib/username";

interface ProfileData {
  display_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  username_changed_at: string | null;
  display_name_changed_at: string | null;
}

export function ProfileSettingsForm({ initial }: { initial: ProfileData }) {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [preview, setPreview] = useState<string | null>(initial.avatar_url);
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canChangeUsername = canChangeIdentity(initial.username_changed_at, initial.username);
  const canChangeDisplayName = canChangeIdentity(
    initial.display_name_changed_at,
    initial.username
  );
  const usernameUnlockDate = formatIdentityUnlockDate(initial.username_changed_at);
  const displayNameUnlockDate = formatIdentityUnlockDate(initial.display_name_changed_at);

  function onAvatarChange(newFile: File | null, previewUrl: string | null) {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(newFile);
    setPreview(previewUrl);
    setRemovePhoto(newFile === null && previewUrl === null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const name = displayName.trim();
    if (!name) {
      setError("Please enter your name");
      return;
    }

    const cleanUsername = normalizeUsername(username);
    if (cleanUsername !== initial.username) {
      const usernameError = getUsernameError(cleanUsername, {
        existingUsername: initial.username,
        allowBrandUsername: true,
      });
      if (usernameError) {
        setError(usernameError);
        return;
      }
    } else if (!USERNAME_RE.test(cleanUsername)) {
      setError("Username must be 3-20 characters: letters, numbers, underscores");
      return;
    }

    if (!canChangeUsername && cleanUsername !== initial.username) {
      setError(`You can change your username again on ${usernameUnlockDate}.`);
      return;
    }

    if (!canChangeDisplayName && name !== (initial.display_name ?? "").trim()) {
      setError(`You can change your name again on ${displayNameUnlockDate}.`);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/profile/avatar/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Failed to upload photo");

        const avatarRes = await fetch("/api/profile/avatar", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatar_url: uploadJson.avatar_url }),
        });

        const avatarJson = await avatarRes.json();
        if (!avatarRes.ok) throw new Error(avatarJson.error ?? "Failed to update photo");
      } else if (removePhoto && initial.avatar_url) {
        const avatarRes = await fetch("/api/profile/avatar", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatar_url: null }),
        });

        const avatarJson = await avatarRes.json();
        if (!avatarRes.ok) throw new Error(avatarJson.error ?? "Failed to remove photo");
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: name,
          username: cleanUsername,
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");

      if (cleanUsername !== initial.username) {
        await createBrowserClient().auth.refreshSession();
      }

      router.push(`/profile/${data.profile.username}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="app-container space-y-6 px-page pb-page pt-4 sm:pt-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${initial.username}`}
          className="text-sm text-gray-400 hover:text-hot"
        >
          Back
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <AvatarPicker
        preview={preview}
        onChange={onAvatarChange}
        size={96}
        allowRemove
        disabled={loading}
      />

      <div>
        <label htmlFor="settings-name" className="mb-1 block text-sm text-gray-400">
          Name
        </label>
        <input
          id="settings-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
          required
          maxLength={50}
          readOnly={!canChangeDisplayName}
          className={`w-full rounded-xl border border-border bg-surface px-4 py-3 ${
            !canChangeDisplayName ? "cursor-not-allowed opacity-70" : ""
          }`}
        />
        {!canChangeDisplayName && displayNameUnlockDate ? (
          <p className="mt-1 text-xs text-gray-500">
            You can change your name again on {displayNameUnlockDate}.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="settings-username" className="mb-1 block text-sm text-gray-400">
          Username
        </label>
        <input
          id="settings-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          maxLength={20}
          readOnly={!canChangeUsername}
          className={`w-full rounded-xl border border-border bg-surface px-4 py-3 ${
            !canChangeUsername ? "cursor-not-allowed opacity-70" : ""
          }`}
        />
        {!canChangeUsername && usernameUnlockDate ? (
          <p className="mt-1 text-xs text-gray-500">
            You can change your username again on {usernameUnlockDate}.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="settings-bio" className="mb-1 block text-sm text-gray-400">
          Bio
        </label>
        <textarea
          id="settings-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          placeholder="enter bio"
          maxLength={BIO_MAX_LENGTH}
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3"
        />
        <p className="mt-1 text-xs text-gray-500">
          {bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>

      <ThemeSetting />

      {error ? <p className="text-sm text-hot">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-hot py-4 font-bold disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>

      <AccountSettingsSection />
    </form>
  );
}
