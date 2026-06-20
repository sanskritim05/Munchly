"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AvatarPicker } from "@/components/AvatarPicker";
import { AppLogo } from "@/components/AppLogo";
import { LandingCarouselBackdrop } from "@/components/LandingCarouselBackdrop";
import { useAuth } from "@/components/AuthProvider";
import { consumeSignupSource, track } from "@/lib/analytics";
import { resolveAuthNext } from "@/lib/auth-redirect";
import { isRegisteredUser } from "@/lib/auth-user";
import { hasSeenPostPrompt } from "@/lib/first-plate-prompt";
import { BIO_MAX_LENGTH } from "@/lib/profile-limits";
import { PASSWORD_MIN_LENGTH } from "@/lib/username-auth";
import { getUsernameError, normalizeUsername } from "@/lib/username";
import type { LandingCarouselPlate } from "@/lib/landing-carousel";

export function ProfileSetupForm({ plates }: { plates: LandingCarouselPlate[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getAccessToken, applySession } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = resolveAuthNext(searchParams.get("next"));
  const nextQuery = next !== "/swipe" ? `?next=${encodeURIComponent(next)}` : "";
  const isGuestSession = Boolean(user?.is_anonymous);
  const completingProfile = isRegisteredUser(user);

  function finishOnboarding() {
    if (!hasSeenPostPrompt()) {
      router.push("/welcome");
      return;
    }

    router.push(next);
  }

  async function completeRegisteredProfile(
    token: string,
    name: string,
    cleanUsername: string
  ) {
    let avatar_url: string | null = null;

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

      avatar_url = uploadJson.avatar_url as string;
    }

    const profileRes = await fetch("/api/profile/setup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: name,
        username: cleanUsername,
        bio,
        avatar_url,
      }),
    });

    if (!profileRes.ok) {
      const profileJson = await profileRes.json();
      throw new Error(profileJson.error ?? "Failed to save profile");
    }

    finishOnboarding();
  }

  function onAvatarChange(newFile: File | null, previewUrl: string | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(newFile);
    setPreview(previewUrl);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const name = displayName.trim();
    if (!name) {
      setError("Please enter your name");
      return;
    }

    const cleanUsername = normalizeUsername(username);
    const usernameError = getUsernameError(cleanUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (!completingProfile) {
      if (password.length < PASSWORD_MIN_LENGTH) {
        setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (completingProfile) {
        const token = getAccessToken();
        if (!token) {
          throw new Error("Session expired. Sign in again.");
        }

        await completeRegisteredProfile(token, name, cleanUsername);
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const guestToken = getAccessToken();
      if (guestToken && isGuestSession) {
        headers.Authorization = `Bearer ${guestToken}`;
      }

      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers,
        body: JSON.stringify({
          display_name: name,
          username: cleanUsername,
          password,
          bio,
        }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        throw new Error(signupData.error ?? "Failed to create account");
      }

      const sessionResult = await applySession(
        signupData.access_token,
        signupData.refresh_token
      );
      if (sessionResult.error) {
        throw new Error(sessionResult.error);
      }

      let avatar_url: string | null = null;

      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/profile/avatar/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${signupData.access_token}` },
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Failed to upload photo");

        avatar_url = uploadJson.avatar_url as string;

        const profileRes = await fetch("/api/profile/setup", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${signupData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display_name: name,
            username: cleanUsername,
            bio,
            avatar_url,
          }),
        });

        if (!profileRes.ok) {
          const profileJson = await profileRes.json();
          throw new Error(profileJson.error ?? "Failed to save profile photo");
        }
      }

      void track("signup_completed", { source: consumeSignupSource() });
      finishOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LandingCarouselBackdrop
      initialPlates={plates}
      contentClassName="w-full max-w-md pb-8 pt-8 text-left sm:pt-12"
    >
      <AppLogo size={140} priority className="mx-auto" />
      <h1 className="mt-6 text-center text-4xl font-bold tracking-tight">
        {completingProfile ? "Finish your profile" : "Get started"}
      </h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
            <AvatarPicker
              preview={preview}
              onChange={onAvatarChange}
              size={96}
              allowRemove
              disabled={loading}
            />

            <div>
              <label htmlFor="display-name" className="mb-1 block text-sm text-gray-400">
                Name
              </label>
              <input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="your name"
                required
                maxLength={50}
                className="w-full rounded-xl border border-border bg-black px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="username" className="mb-1 block text-sm text-gray-400">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your username"
                required
                maxLength={20}
                autoComplete="username"
                className="w-full rounded-xl border border-border bg-black px-4 py-3"
              />
            </div>

            {!completingProfile ? (
              <>
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm text-gray-400">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="at least 6 characters"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border bg-black px-4 py-3"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-sm text-gray-400">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="repeat your password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border bg-black px-4 py-3"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label htmlFor="bio" className="mb-1 block text-sm text-gray-400">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                maxLength={BIO_MAX_LENGTH}
                placeholder="enter bio"
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-black px-4 py-3"
              />
              <p className="mt-1 text-xs text-gray-500">
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>

            {error ? <p className="text-sm text-hot">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-hot py-4 text-lg font-bold disabled:opacity-50"
            >
              {loading
                ? completingProfile
                  ? "Saving profile..."
                  : "Creating account..."
                : completingProfile
                  ? "Save profile"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href={`/signin${nextQuery}`} className="text-hot hover:underline">
              Sign in
            </Link>
          </p>
    </LandingCarouselBackdrop>
  );
}
