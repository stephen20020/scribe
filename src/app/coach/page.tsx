"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { CoachDeals } from "@/components/coach-deals";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { buildRulesCoach } from "@/lib/coach/rules";

export default function CoachPage() {
  const profile = useScribeStore((s) => s.typingProfile);
  const narrative = profile.narrative ?? buildRulesCoach(profile).narrative;

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
        <PageEnter className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
          <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
            Typing coach
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            Practice deals
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted">{narrative}</p>

          <CoachDeals />

          <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
            <Link
              href="/dashboard"
              className="rounded-full border border-line px-6 py-3 text-sm text-ink-muted hover:text-ink"
            >
              Dashboard
            </Link>
            <Link
              href="/type"
              className="rounded-full border border-line px-6 py-3 text-sm text-ink-muted hover:text-ink"
            >
              Type Scripture
            </Link>
            <Link
              href="/warm-up"
              className="rounded-full border border-line px-6 py-3 text-sm text-ink-muted hover:text-ink"
            >
              Pangram warm-up
            </Link>
          </div>
        </PageEnter>
      </main>
    </div>
  );
}
