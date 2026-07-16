"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { TypingLesson } from "@/components/typing-lesson";

const PANGRAM = "The quick brown fox jumps over the lazy dog.";

function WarmUpInner() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode");
  const focus = params.get("focus");

  // Legacy coach links → new practice deal page
  useEffect(() => {
    if (mode === "coach" && focus) {
      const phase = params.get("phase");
      const qs = new URLSearchParams({ focus });
      if (phase) qs.set("phase", phase);
      router.replace(`/coach/drill?${qs.toString()}`);
    }
  }, [mode, focus, params, router]);

  if (mode === "coach" && focus) {
    return (
      <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
        <p className="text-sm text-ink-muted">Opening practice deal…</p>
      </PageEnter>
    );
  }

  return (
    <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <TypingLesson
        version="web"
        book="Practice"
        chapter={1}
        verse={1}
        scope="verse"
        passageLength={1}
        practiceText={PANGRAM}
        practiceLabel="Warm-up · Pangram"
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
