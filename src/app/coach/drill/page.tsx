"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { TypingLesson } from "@/components/typing-lesson";
import {
  buildPracticeDeal,
  flattenDealText,
  getDealPhase,
} from "@/lib/coach/drill";

function DrillInner() {
  const params = useSearchParams();
  const focus = params.get("focus") || "";
  const phaseParam = params.get("phase");
  const phase =
    phaseParam === "isolate" ||
    phaseParam === "context" ||
    phaseParam === "transfer"
      ? phaseParam
      : null;

  const deal = useMemo(
    () => (focus ? buildPracticeDeal({ focus }) : null),
    [focus],
  );

  const pack = useMemo(() => {
    if (!deal) return null;
    const step = getDealPhase(deal, phase);
    const text = phase ? step.text : flattenDealText(deal);
    const label = phase
      ? `${deal.title} · ${step.label}`
      : `${deal.title} · Practice`;
    return { text, label, cue: phase ? step.cue : deal.why };
  }, [deal, phase]);

  if (!deal || !pack || !focus) {
    return (
      <PageEnter className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl tracking-tight">Practice</h1>
        <p className="mt-3 text-sm text-ink-muted">
          No practice deal selected.{" "}
          <Link href="/coach" className="underline">
            Back to coach
          </Link>
        </p>
      </PageEnter>
    );
  }

  return (
    <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="mb-8 max-w-xl">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          Practice
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          {deal.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{pack.cue}</p>
        <p className="mt-4">
          <Link
            href="/coach"
            className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            ← Coach
          </Link>
        </p>
      </div>

      {/* Stable key: rules pack only — no mid-lesson AI text swap */}
      <TypingLesson
        key={`${focus}-${phase ?? "full"}`}
        version="web"
        book="Practice"
        chapter={1}
        verse={1}
        scope="verse"
        passageLength={1}
        practiceText={pack.text}
        practiceLabel={pack.label}
      />
    </PageEnter>
  );
}

export default function CoachDrillPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
              <p className="text-sm text-ink-muted">Loading practice…</p>
            </PageEnter>
          }
        >
          <DrillInner />
        </Suspense>
      </main>
    </div>
  );
}
