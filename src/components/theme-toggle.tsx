"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="h-9 w-9 rounded-full border border-line"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-bg-elevated/70 px-3 text-sm text-ink-muted transition hover:text-ink"
    >
      <span className="font-mono text-[11px] tracking-wider uppercase">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
