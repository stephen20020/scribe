"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { TypingLesson } from "@/components/typing-lesson";
import { buildDrillText, drillLabel } from "@/lib/coach/drill";

const PANGRAM = "The quick brown fox jumps over the lazy dog.";

const PUNCT_DRILL =
  "Yes, Lord; 'tis so. Wait: hope! Faith, hope, love. Amen.";

const FATIGUE_DRILL =
  "Slow is smooth. Smooth is fast. Breathe, then type. Keep a steady pace.";

function WarmUpInner() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const focus = params.get("focus");

  const { text, label } = useMemo(() => {
    if (mode !== "coach" || !focus) {
      return { text: PANGRAM, label: "Warm-up · Pangram" };
    }
    if (focus === "punctuation") {
      return { text: PUNCT_DRILL, label: drillLabel("punctuation") };
    }
    if (focus === "fatigue") {
      return { text: FATIGUE_DRILL, label: drillLabel("fatigue") };
    }
    return {
      text: buildDrillText([focus], 5),
      label: drillLabel(focus),
    };
  }, [mode, focus]);

  return (
    <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <TypingLesson
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

export default function WarmUpPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
              <p className="text-sm text-ink-muted">Loading warm-up…</p>
            </PageEnter>
          }
        >
          <WarmUpInner />
        </Suspense>
      </main>
    </div>
  );
}
