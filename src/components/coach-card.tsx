"use client";

import Link from "next/link";
import { CoachDeals } from "@/components/coach-deals";

export function CoachCard() {
  return (
    <section className="mt-14 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Coach</h2>
        <Link href="/coach" className="text-sm text-ink-muted hover:text-ink">
          Details →
        </Link>
      </div>
      <CoachDeals compact />
    </section>
  );
}
