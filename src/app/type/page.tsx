"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { ScripturePicker } from "@/components/scripture-picker";
import { TypingLesson } from "@/components/typing-lesson";
import {
  isBibleVersionId,
  type BibleVersionId,
  type LessonScope,
} from "@/lib/bible/types";

function TypeContent() {
  const params = useSearchParams();
  const go = params.get("go") === "1";

  const version = (
    isBibleVersionId(params.get("version"))
      ? params.get("version")
      : "web"
  ) as BibleVersionId;
  const book = params.get("book") || "John";
  const chapter = Number(params.get("chapter") || 3);
  const verse = Number(params.get("verse") || 16);
  const scope = (
    ["verse", "passage", "chapter"].includes(params.get("scope") ?? "")
      ? params.get("scope")
      : "passage"
  ) as LessonScope;
  const passageLength = Number(params.get("passage") || 5);
  const planId = params.get("planId") || undefined;
  const planDay = params.get("planDay")
    ? Number(params.get("planDay"))
    : undefined;
  const isRandom = params.get("random") === "1";
  const safeChapter = Number.isFinite(chapter) ? chapter : 1;
  const safeVerse = Number.isFinite(verse) ? verse : 1;
  const safePassage = Number.isFinite(passageLength) ? passageLength : 5;
  const lessonKey = `${version}:${book}:${safeChapter}:${safeVerse}:${scope}:${safePassage}:${planId ?? ""}:${planDay ?? ""}:${isRandom ? "r" : ""}`;

  return (
    <PageEnter className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      {go ? (
        <TypingLesson
          key={lessonKey}
          version={version}
          book={book}
          chapter={safeChapter}
          verse={safeVerse}
          scope={scope}
          passageLength={safePassage}
          planId={planId}
          planDay={planDay}
          isRandom={isRandom}
        />
      ) : (
        <ScripturePicker
          initialBook={params.get("book") || undefined}
          initialChapter={
            params.get("chapter") ? Number(params.get("chapter")) : undefined
          }
          initialVerse={
            params.get("verse") ? Number(params.get("verse")) : undefined
          }
          initialScope={
            params.get("scope")
              ? (params.get("scope") as LessonScope)
              : undefined
          }
          planId={planId}
          planDay={planDay}
        />
      )}
    </PageEnter>
  );
}

export default function TypePage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <p className="px-8 py-16 text-ink-muted">Loading…</p>
          }
        >
          <TypeContent />
        </Suspense>
      </main>
    </div>
  );
}
