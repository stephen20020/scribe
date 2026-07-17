"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { useAuth } from "@/components/auth-provider";
import { CoachDeals } from "@/components/coach-deals";
import { CoachSignInPrompt } from "@/components/coach-sign-in";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { buildRulesCoach } from "@/lib/coach/rules";

export default function CoachPage() {
  const { user, loading } = useAuth();
  const profile = useScribeStore((s) => s.typingProfile);
  const rules = buildRulesCoach(profile);
  const narrative = profile.narrative ?? rules.narrative;

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
        <PageEnter className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
          <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
            Typing coach
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            Coach
          </h1>

          {loading ? (
            <p className="mt-4 text-ink-muted">Loading…</p>
          ) : !user ? (
            <CoachSignInPrompt />
          ) : (
            <>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
                {narrative}
              </p>
              <CoachDeals />
            </>
          )}

          <p className="mt-14 text-sm text-ink-muted">
            <Link href="/type" className="underline underline-offset-4">
              Type Scripture
            </Link>
            <span className="mx-2 text-ink-faint">·</span>
            <Link href="/dashboard" className="underline underline-offset-4">
              Dashboard
            </Link>
          </p>
        </PageEnter>
      </main>
    </div>
  );
}
