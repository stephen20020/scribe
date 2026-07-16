"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { localizeBookName } from "@/lib/bible/books";
import { getBook, loadBible } from "@/lib/bible/load";
import { parseReference } from "@/lib/bible/references";
import {
  BIBLE_LANGUAGES,
  DEFAULT_VERSION,
  languageForVersion,
  versionsForLanguage,
  type BibleData,
  type BibleLanguageId,
  type BibleVersionId,
  type LessonScope,
} from "@/lib/bible/types";
import { RandomVerseButton } from "@/components/random-verse-button";
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
  const setLanguagePref = useScribeStore((s) => s.setLanguage);
  const setVersion = useScribeStore((s) => s.setVersion);
  const setDefaultScope = useScribeStore((s) => s.setDefaultScope);
  const setPassageLength = useScribeStore((s) => s.setPassageLength);

  const [bible, setBible] = useState<BibleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [version, setLocalVersion] = useState<BibleVersionId>(
    preferences.version,
  );
  const language = languageForVersion(version);
  const [book, setBook] = useState(
    localizeBookName(initialBook ?? "John", language),
  );
  const [chapter, setChapter] = useState(initialChapter ?? 3);
  const [verse, setVerse] = useState(initialVerse ?? 16);
  const [scope, setScope] = useState<LessonScope>(
    initialScope ?? preferences.defaultScope,
  );
  const [passageLength, setLocalPassageLength] = useState(
    preferences.passageLength,
  );
  const [refQuery, setRefQuery] = useState("");

  const versions = versionsForLanguage(language);

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
          const localized = localizeBookName(
            book,
            data.language ?? languageForVersion(version),
          );
          if (getBook(data, localized)) {
            if (localized !== book) setBook(localized);
          } else {
            setBook(data.books[42]?.name ?? data.books[0].name);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => {
            setError(
              language === "es"
                ? "No se pudo cargar esta traducción."
                : "Could not load this translation.",
            );
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // intentionally depend on version; book remaps inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const selectedBook = useMemo(
    () => (bible ? getBook(bible, book) : null),
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

  function changeLanguage(next: BibleLanguageId) {
    if (next === language) return;
    const nextVersion = DEFAULT_VERSION[next];
    setLanguagePref(next);
    setLocalVersion(nextVersion);
    setVersion(nextVersion);
    setBook(localizeBookName(book, next));
    setBible(null);
  }

  function changeVersion(next: BibleVersionId) {
    setLocalVersion(next);
    setVersion(next);
    setBook(localizeBookName(book, languageForVersion(next)));
  }

  function applyReference() {
    if (!bible) return;
    const parsed = parseReference(refQuery);
    if (!parsed) {
      setError(
        language === "es"
          ? "Prueba una referencia como Juan 3:16 o Salmos 23."
          : "Try a reference like John 3:16 or Psalms 23.",
      );
      return;
    }
    const found = getBook(bible, parsed.book);
    if (!found) {
      setError(
        language === "es"
          ? `Libro no encontrado: ${parsed.book}`
          : `Book not found: ${parsed.book}`,
      );
      return;
    }
    if (parsed.chapter < 1 || parsed.chapter > found.chapters.length) {
      setError(
        language === "es" ? "Capítulo fuera de rango." : "Chapter out of range.",
      );
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
      book: selectedBook?.name ?? book,
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

  const copy =
    language === "es"
      ? {
          eyebrow: "Elige el pasaje",
          title: "¿Dónde vas a escribir?",
          translation: "Traducción",
          language: "Idioma",
          jump: "Ir a la referencia",
          jumpPlaceholder: "Juan 3:16–21",
          go: "Ir",
          loading: "Cargando escritura…",
          book: "Libro",
          chapter: "Capítulo",
          startVerse: "Versículo inicial",
          lessonSize: "Tamaño de la lección",
          verse: "Un versículo",
          passage: "Pasaje",
          chapterScope: "Capítulo completo",
          verses: "Versículos",
          begin: "Empezar a escribir",
        }
      : {
          eyebrow: "Choose your place",
          title: "Where will you type?",
          translation: "Translation",
          language: "Language",
          jump: "Jump by reference",
          jumpPlaceholder: "John 3:16–21",
          go: "Go",
          loading: "Loading scripture…",
          book: "Book",
          chapter: "Chapter",
          startVerse: "Start verse",
          lessonSize: "Lesson size",
          verse: "One verse",
          passage: "Passage",
          chapterScope: "Whole chapter",
          verses: "Verses",
          begin: "Begin typing",
        };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          {copy.title}
        </h1>
      </div>

      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm text-ink-muted">{copy.language}</legend>
          <div
            className="inline-flex rounded-full border border-line p-1"
            role="group"
            aria-label={copy.language}
          >
            {BIBLE_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                aria-pressed={language === lang.id}
                onClick={() => changeLanguage(lang.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  language === lang.id
                    ? "bg-ink text-bg"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {lang.short}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm text-ink-muted">
            {copy.translation}
          </legend>
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={version === v.id}
                title={v.name}
                onClick={() => changeVersion(v.id)}
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
            {copy.jump}
          </label>
          <div className="flex gap-2">
            <input
              id="ref"
              value={refQuery}
              onChange={(e) => setRefQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyReference();
              }}
              placeholder={copy.jumpPlaceholder}
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 text-ink outline-none ring-accent focus:ring-2"
            />
            <button
              type="button"
              onClick={applyReference}
              className="rounded-xl border border-line px-4 py-3 text-sm text-ink-muted transition hover:text-ink"
            >
              {copy.go}
            </button>
          </div>
        </div>

        {isPending && !bible && (
          <p className="text-sm text-ink-muted">{copy.loading}</p>
        )}
        {!bible && !error && (
          <p className="text-sm text-ink-muted">{copy.loading}</p>
        )}
        {error && (
          <p className="text-sm text-incorrect" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        {bible && selectedBook && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">{copy.book}</span>
                <select
                  value={selectedBook.name}
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
                <span className="mb-2 block text-ink-muted">{copy.chapter}</span>
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
                <span className="mb-2 block text-ink-muted">
                  {copy.startVerse}
                </span>
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
              <legend className="mb-2 text-sm text-ink-muted">
                {copy.lessonSize}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["verse", copy.verse],
                    ["passage", copy.passage],
                    ["chapter", copy.chapterScope],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={scope === value}
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
                  {copy.verses}
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

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startTyping}
                className="w-full rounded-full bg-ink px-6 py-4 font-display text-lg text-bg transition hover:opacity-90 sm:w-auto sm:px-10"
              >
                {copy.begin}
              </button>
              <RandomVerseButton
                version={version}
                className="w-full rounded-full border border-line px-6 py-3.5 text-sm text-ink-muted transition hover:text-ink sm:w-auto"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
