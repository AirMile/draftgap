"use client";

import { useState, useCallback } from "react";
import { buildShareUrl } from "@/lib/url-sharing";
import type { Role, Tier } from "@/lib/types";

export function ShareButton({
  role,
  champions,
  tier,
}: {
  role: Role;
  champions: string[];
  tier: Tier;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = buildShareUrl(role, champions, tier);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [role, champions, tier]);

  const icon = copied ? (
    <svg
      className="w-4 h-4 text-win"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );

  const label = copied ? "Copied!" : "Share";
  const labelColor = copied ? "text-win" : "";

  return (
    <>
      {/* Desktop: inline button in header */}
      <button
        onClick={handleCopy}
        className="hidden sm:flex bg-background border border-card-border rounded-lg px-3 py-1 text-sm text-muted font-medium h-[38px] items-center gap-1.5 hover:border-accent/30 transition-colors"
        aria-label={copied ? "Link copied" : "Share pool link"}
      >
        {icon}
        <span className={labelColor}>{label}</span>
      </button>

      {/* Mobile: floating pill bottom-right with toast */}
      <div className="sm:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <div
          className={`bg-card border border-win/40 text-win text-sm font-medium rounded-lg px-3 py-2 shadow-lg shadow-black/30 transition-all duration-200 ${copied ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"}`}
        >
          Link copied!
        </div>
        <button
          onClick={handleCopy}
          className={`rounded-full p-3 shadow-lg shadow-black/30 transition-colors ${copied ? "bg-card border border-win/40 text-win" : "bg-card border border-accent/40 text-accent"}`}
          aria-label={copied ? "Link copied" : "Share pool link"}
        >
          {icon}
        </button>
      </div>
    </>
  );
}
