"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined during SSR and the first client render, so both
  // passes agree on the moon and next-themes swaps it once it knows.
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ padding: 7 }}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
