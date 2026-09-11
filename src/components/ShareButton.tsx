"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

type ShareButtonProps = {
  title: string;
  text: string;
  className?: string;
};

export function ShareButton({ title, text, className = "btn" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy(url: string) {
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await copy(url);
    } catch (error) {
      // A canceled share sheet is not a failure; anything else falls back
      // to the clipboard so the button always does something.
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await copy(url);
      } catch {
        setCopied(false);
      }
    }
  }

  return (
    <button type="button" className={className} onClick={share}>
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
