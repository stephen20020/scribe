"use client";

import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { TypingLesson } from "@/components/typing-lesson";

const PANGRAM =
  "The quick brown fox jumps over the lazy dog.";

export default function WarmUpPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
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
      </main>
    </div>
  );
}
