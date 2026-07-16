"use client";

import Link from "next/link";
import { CoachDeals } from "@/components/coach-deals";
import { buildRulesCoach } from "@/lib/coach/rules";
import { useScribeStore } from "@/lib/store/use-scribe-store";

export function CoachCard() {
  const profile = useScribeStore((s) => s.typingProfile);
  const rules = buildRulesCoach(profile);
  const hasDeals = rules.deals.length > 0;

  return (
    <section className="mt-14 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Typing coach</h2>
        <Link
          href="/coach"
          className="text-sm text-ink-muted hover:text-ink"
        >
          Open coach →
        </Link>
      </div>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        {hasDeals
          ? "Custom practice deals built from your miss patterns — isolate, context, transfer."
          : "Type a few lessons and the coach will open practice deals for your weakest reaches."}
      </p>
      <CoachDeals compact />
    </section>
  );
}
