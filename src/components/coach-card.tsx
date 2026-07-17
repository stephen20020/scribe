"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { CoachDeals } from "@/components/coach-deals";
import { CoachSignInPrompt } from "@/components/coach-sign-in";

export function CoachCard() {
  const { user, loading } = useAuth();

  return (
    <section className="mt-14 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Coach</h2>
        {user && (
          <Link href="/coach" className="text-sm text-ink-muted hover:text-ink">
            Details →
          </Link>
        )}
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-ink-muted">Loading…</p>
      ) : user ? (
        <CoachDeals compact />
      ) : (
        <CoachSignInPrompt compact />
      )}
    </section>
  );
}
