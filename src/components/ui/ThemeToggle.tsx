"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Both icons are always rendered and CSS picks one from the `.dark` class that
 * next-themes sets before hydration. Branching on `resolvedTheme` instead would
 * mismatch: the server has no theme, the client may already know it from
 * localStorage, and React then throws away the server HTML for the whole tree.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ padding: 7 }}
      aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon size={15} className="theme-icon-light" aria-hidden />
      <Sun size={15} className="theme-icon-dark" aria-hidden />
    </button>
  );
}
