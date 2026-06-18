"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function ShareCopyLink({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      void track("share_link_copied", { plate_id: shareUrl.split("/").pop() });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-[#222] bg-[#111] p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#666]">Share link</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={shareUrl}
          className="min-w-0 flex-1 truncate rounded-xl border border-[#222] bg-[#080808] px-3 py-2.5 text-sm text-[#f0ede6]"
          aria-label="Share link"
        />
        <button
          type="button"
          onClick={() => void copyLink()}
          className="shrink-0 rounded-xl bg-[#ff3c00] px-4 py-2.5 text-sm font-bold text-white"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
