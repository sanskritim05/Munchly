"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export function AccountSettingsSection() {
  const router = useRouter();
  const { getAccessToken, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    const token = getAccessToken();
    if (!token) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Could not delete account");
      }

      await signOut();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  const canConfirmDelete = confirmText.trim().toLowerCase() === "delete";

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-1 text-sm text-gray-400">
          Sign out or permanently delete your account and all of your plates.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut || deleting}
        className="w-full rounded-full border border-border bg-surface py-3 font-semibold transition-colors hover:border-hot/50 disabled:opacity-50"
      >
        {signingOut ? "Signing out..." : "Sign out"}
      </button>

      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => {
            setConfirmOpen(true);
            setConfirmText("");
            setError("");
          }}
          disabled={signingOut || deleting}
          className="w-full rounded-full border border-hot/40 py-3 font-semibold text-hot transition-colors hover:bg-hot/10 disabled:opacity-50"
        >
          Delete account
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-hot/30 bg-hot/5 p-4">
          <p className="text-sm">
            This permanently deletes your profile, plates, ratings, and comments. This
            cannot be undone.
          </p>
          <label htmlFor="delete-confirm" className="block text-sm text-gray-400">
            Type <span className="font-semibold text-white">delete</span> to confirm
          </label>
          <input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            disabled={deleting}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText("");
                setError("");
              }}
              disabled={deleting}
              className="flex-1 rounded-full border border-border py-3 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={!canConfirmDelete || deleting}
              className="flex-1 rounded-full bg-hot py-3 font-semibold disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete forever"}
            </button>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-hot">{error}</p> : null}
    </section>
  );
}
