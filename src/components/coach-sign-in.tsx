"use client";

import Link from "next/link";

export function CoachSignInPrompt({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-4" : "mt-8"}>
      <p className="max-w-md text-sm leading-relaxed text-ink-muted">
        The typing coach is part of your account — it learns from your synced
        sessions and builds practice deals only when you&apos;re signed in.
      </p>
      <Link
        href="/account"
        className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-bg transition hover:opacity-90"
      >
        Sign in for coach
      </Link>
    </div>
  );
}
