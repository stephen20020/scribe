"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
  const focus = params.get("focus") || "e>r";
  const phase = params.get("phase");

  const baseDeal = useMemo(() => buildPracticeDeal({ focus }), [focus]);
  const basePhase = useMemo(
    () => getDealPhase(baseDeal, phase),
    [baseDeal, phase],
  );

  const fallbackText = useMemo(
    () => (phase ? basePhase.text : flattenDealText(baseDeal)),
    [phase, basePhase, baseDeal],
  );
  const fallbackLabel = useMemo(
    () =>
      `${baseDeal.title}${phase ? ` · ${basePhase.label}` : " · Full deal"}`,
    [baseDeal.title, phase, basePhase.label],
  );
  const cue = phase
    ? basePhase.cue
    : "Three phases in one pass. Stay accurate.";

  const [ai, setAi] = useState<{
    focus: string;
    phase: string | null;
    text: string;
    label: string;
    source: "ai";
  } | null>(null);

  const active =
    ai && ai.focus === focus && ai.phase === (phase ?? null) ? ai : null;
  const text = active?.text ?? fallbackText;
  const label = active?.label ?? fallbackLabel;
  const source = active?.source ?? "rules";

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/coach/drill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ focus, phase, ai: true }),
        });
        const data = (await res.json()) as {
          text?: string;
          label?: string;
          source?: "rules" | "ai";
        };
        if (cancelled || !res.ok || !data.text || data.source !== "ai") return;
        setAi({
          focus,
          phase: phase ?? null,
          text: data.text,
          label: data.label ?? fallbackLabel,
          source: "ai",
        });
      } catch {
        // keep rules text
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focus, phase, fallbackLabel]);

  const phaseLinks = baseDeal.phases.map((p) => ({
    ...p,
    href: `/coach/drill?focus=${encodeURIComponent(focus)}&phase=${p.id}`,
  }));

  return (
    <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          Practice deal
          {source === "ai" ? " · Claude custom" : " · pattern pack"}
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          {baseDeal.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{baseDeal.why}</p>
        <p className="mt-3 text-sm text-ink">{cue}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {phaseLinks.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className={`rounded-full px-4 py-2 text-xs ${
                phase === p.id
                  ? "bg-ink text-bg"
                  : "border border-line text-ink-muted hover:text-ink"
              }`}
            >
              {p.label}
            </Link>
          ))}
          <Link
            href={`/coach/drill?focus=${encodeURIComponent(focus)}`}
            className={`rounded-full px-4 py-2 text-xs ${
              !phase
                ? "bg-ink text-bg"
                : "border border-line text-ink-muted hover:text-ink"
            }`}
          >
            Full deal
          </Link>
          <Link
            href="/coach"
            className="rounded-full border border-line px-4 py-2 text-xs text-ink-muted hover:text-ink"
          >
            All deals
          </Link>
        </div>
      </div>

      <TypingLesson
        key={`${focus}-${phase ?? "all"}-${source}-${text.slice(0, 32)}`}
        version="web"
        book="Practice"
        chapter={1}
        verse={1}
        scope="verse"
        passageLength={1}
        practiceText={text}
        practiceLabel={label}
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
              <p className="text-sm text-ink-muted">Loading practice deal…</p>
            </PageEnter>
          }
        >
          <DrillInner />
        </Suspense>
      </main>
    </div>
  );
}
