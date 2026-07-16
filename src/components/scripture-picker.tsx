"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loadBible } from "@/lib/bible/load";
import { parseReference } from "@/lib/bible/references";
import {
  BIBLE_VERSIONS,
  type BibleData,
  type BibleVersionId,
  type LessonScope,
} from "@/lib/bible/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { cn } from "@/lib/utils";

export function ScripturePicker({
  initialBook,
  initialChapter,
  initialVerse,
  initialScope,
  planId,
  planDay,
}: {
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  initialScope?: LessonScope;
  planId?: string;
  planDay?: number;
}) {
  const router = useRouter();
  const preferences = useScribeStore((s) => s.preferences);
  const setVersion = useScribeStore((s) => s.setVersion);
  const setDefaultScope = useScribeStore((s) => s.setDefaultScope);
  const setPassageLength = useScribeStore((s) => s.setPassageLength);

  const [bible, setBible] = useState<BibleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [version, setLocalVersion] = useState<BibleVersionId>(
    preferences.version,
  );
  const [book, setBook] = useState(initialBook ?? "John");
  const [chapter, setChapter] = useState(initialChapter ?? 3);
  const [verse, setVerse] = useState(initialVerse ?? 16);
  const [scope, setScope] = useState<LessonScope>(
    initialScope ?? preferences.defaultScope,
  );
  const [passageLength, setLocalPassageLength] = useState(
    preferences.passageLength,
  );
  const [refQuery, setRefQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      setError(null);
    });
    loadBible(version)
      .then((data) => {
        if (cancelled) return;
        startTransition(() => {
          setBible(data);
          const exists = data.books.some((b) => b.name === book);
          if (!exists) {
            setBook(data.books[42]?.name ?? data.books[0].name);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => {
            setError("Could not load this translation.");
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version, book]);

  const selectedBook = useMemo(
    () => bible?.books.find((b) => b.name === book) ?? null,
    [bible, book],
  );

  const chapterCount = selectedBook?.chapters.length ?? 1;
  const safeChapter =
    chapter >= 1 && chapter <= chapterCount ? chapter : 1;
  const verseCount =
    selectedBook && safeChapter >= 1 && safeChapter <= chapterCount
      ? selectedBook.chapters[safeChapter - 1].length
      : 1;
  const safeVerse = verse >= 1 && verse <= verseCount ? verse : 1;

  function applyReference() {
    if (!bible) return;
    const parsed = parseReference(refQuery);
    if (!parsed) {
      setError("Try a reference like John 3:16 or Psalms 23.");
      return;
    }
    const found = bible.books.find(
      (b) => b.name.toLowerCase() === parsed.book.toLowerCase(),
    );
    if (!found) {
      setError(`Book not found: ${parsed.book}`);
      return;
    }
    if (parsed.chapter < 1 || parsed.chapter > found.chapters.length) {
      setError("Chapter out of range.");
      return;
    }
    const maxV = found.chapters[parsed.chapter - 1].length;
    const start = Math.min(parsed.startVerse, maxV);
    const end = Math.min(parsed.endVerse || start, maxV);
    setError(null);
    setBook(found.name);
    setChapter(parsed.chapter);
    setVerse(start);
    if (end > start) {
      setScope("passage");
      setLocalPassageLength(end - start + 1);
      setPassageLength(end - start + 1);
    } else if (!refQuery.includes(":")) {
      setScope("chapter");
    } else {
      setScope("verse");
    }
  }

  function startTyping() {
    setVersion(version);
    setDefaultScope(scope);
    setPassageLength(passageLength);

    const params = new URLSearchParams({
      version,
      book,
      chapter: String(safeChapter),
      verse: String(scope === "chapter" ? 1 : safeVerse),
      scope,
      passage: String(passageLength),
      go: "1",
    });
    if (planId) params.set("planId", planId);
    if (planDay) params.set("planDay", String(planDay));
    router.push(`/type?${params.toString()}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          Choose your place
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          Where will you type?
        </h1>
      </div>

      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm text-ink-muted">Translation</legend>
          <div className="flex flex-wrap gap-2">
            {BIBLE_VERSIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setLocalVersion(v.id);
                  setVersion(v.id);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  version === v.id
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-line text-ink-muted hover:text-ink",
                )}
              >
                {v.short}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-2 block text-sm text-ink-muted" htmlFor="ref">
            Jump by reference
          </label>
          <div className="flex gap-2">
            <input
              id="ref"
              value={refQuery}
              onChange={(e) => setRefQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyReference();
              }}
              placeholder="John 3:16–21"
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 text-ink outline-none ring-accent focus:ring-2"
            />
            <button
              type="button"
              onClick={applyReference}
              className="rounded-xl border border-line px-4 py-3 text-sm text-ink-muted transition hover:text-ink"
            >
              Go
            </button>
          </div>
        </div>

        {isPending && !bible && (
          <p className="text-sm text-ink-muted">Loading scripture…</p>
        )}
        {!bible && !error && (
          <p className="text-sm text-ink-muted">Loading scripture…</p>
        )}
        {error && <p className="text-sm text-incorrect">{error}</p>}

        {bible && selectedBook && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Book</span>
                <select
                  value={book}
                  onChange={(e) => {
                    setBook(e.target.value);
                    setChapter(1);
                    setVerse(1);
                  }}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3 text-ink outline-none"
                >
                  {bible.books.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Chapter</span>
                <select
                  value={safeChapter}
                  onChange={(e) => {
                    setChapter(Number(e.target.value));
                    setVerse(1);
                  }}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3 text-ink outline-none"
                >
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Start verse</span>
                <select
                  value={safeVerse}
                  disabled={scope === "chapter"}
                  onChange={(e) => setVerse(Number(e.target.value))}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3 text-ink outline-none disabled:opacity-50"
                >
                  {Array.from({ length: verseCount }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm text-ink-muted">Lesson size</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["verse", "One verse"],
                    ["passage", "Passage"],
                    ["chapter", "Whole chapter"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScope(value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition",
                      scope === value
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-line text-ink-muted hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {scope === "passage" && (
                <label className="mt-4 flex items-center gap-3 text-sm text-ink-muted">
                  Verses
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={passageLength}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setLocalPassageLength(n);
                      setPassageLength(n);
                    }}
                    className="flex-1 accent-[var(--accent)]"
                  />
                  <span className="w-6 font-mono text-ink">{passageLength}</span>
                </label>
              )}
            </fieldset>

            <button
              type="button"
              onClick={startTyping}
              className="mt-2 w-full rounded-full bg-ink px-6 py-4 font-display text-lg text-bg transition hover:opacity-90 sm:w-auto sm:px-10"
            >
              Begin typing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
