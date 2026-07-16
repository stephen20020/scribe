"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { loadBible } from "@/lib/bible/load";
import type { BibleData, LessonScope } from "@/lib/bible/types";
import type { PlanDay } from "@/lib/plans/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { uid } from "@/lib/utils";

export default function NewPlanPage() {
  const router = useRouter();
  const version = useScribeStore((s) => s.preferences.version);
  const addCustomPlan = useScribeStore((s) => s.addCustomPlan);

  const [bible, setBible] = useState<BibleData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [book, setBook] = useState("John");
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(3);
  const [scope, setScope] = useState<LessonScope>("chapter");
  const [days, setDays] = useState<PlanDay[]>([]);

  useEffect(() => {
    loadBible(version).then((data) => {
      setBible(data);
      if (!data.books.some((b) => b.name === book)) {
        setBook(data.books[0].name);
      }
    });
  }, [version, book]);

  const selectedBook = useMemo(
    () => bible?.books.find((b) => b.name === book) ?? null,
    [bible, book],
  );
  const chapterCount = selectedBook?.chapters.length ?? 1;

  function addChapterRange() {
    if (!selectedBook) return;
    const from = Math.min(startChapter, endChapter);
    const to = Math.max(startChapter, endChapter);
    const next: PlanDay[] = [];
    let day = (days[days.length - 1]?.day ?? 0) + 1;
    for (let c = from; c <= Math.min(to, chapterCount); c++) {
      next.push({
        day,
        book: selectedBook.name,
        chapter: c,
        startVerse: 1,
        scope,
        passageLength: scope === "passage" ? 5 : undefined,
        label:
          scope === "chapter"
            ? `${selectedBook.name} ${c}`
            : `${selectedBook.name} ${c}:1+`,
      });
      day += 1;
    }
    setDays((d) => [...d, ...next]);
  }

  function save() {
    if (!title.trim() || days.length === 0) return;
    const id = uid("plan");
    addCustomPlan({
      id,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      days: days.map((d, i) => ({ ...d, day: i + 1 })),
      isCustom: true,
    });
    router.push(`/plans/${id}`);
  }

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <PageEnter className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          Custom
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Build a plan
        </h1>
        <p className="mt-3 text-ink-muted">
          Name it, add chapter ranges, then start typing day by day.
        </p>

        <div className="mt-10 space-y-5">
          <label className="block text-sm">
            <span className="mb-2 block text-ink-muted">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My morning path"
              className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-ink-muted">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
            />
          </label>

          {bible && selectedBook && (
            <div className="space-y-4 border-t border-line pt-6">
              <p className="text-sm text-ink-muted">Add chapters</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-ink-faint">Book</span>
                  <select
                    value={book}
                    onChange={(e) => {
                      setBook(e.target.value);
                      setStartChapter(1);
                      setEndChapter(1);
                    }}
                    className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3"
                  >
                    {bible.books.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-ink-faint">Lesson size</span>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as LessonScope)}
                    className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3"
                  >
                    <option value="chapter">Whole chapter</option>
                    <option value="passage">Passage from v1</option>
                    <option value="verse">First verse only</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-ink-faint">From chapter</span>
                  <select
                    value={startChapter}
                    onChange={(e) => setStartChapter(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3"
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
                <label className="text-sm">
                  <span className="mb-1 block text-ink-faint">To chapter</span>
                  <select
                    value={endChapter}
                    onChange={(e) => setEndChapter(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-bg-elevated/80 px-3 py-3"
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
              </div>
              <button
                type="button"
                onClick={addChapterRange}
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink-muted transition hover:text-ink"
              >
                Add to plan
              </button>
            </div>
          )}

          {days.length > 0 && (
            <div className="border-t border-line pt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-ink-muted">{days.length} days</p>
                <button
                  type="button"
                  onClick={() => setDays([])}
                  className="text-sm text-ink-faint hover:text-incorrect"
                >
                  Clear
                </button>
              </div>
              <ol className="max-h-56 space-y-1 overflow-y-auto text-sm">
                {days.map((d, i) => (
                  <li
                    key={`${d.book}-${d.chapter}-${i}`}
                    className="flex justify-between border-b border-line/50 py-2"
                  >
                    <span>
                      Day {i + 1}: {d.label}
                    </span>
                    <button
                      type="button"
                      className="text-ink-faint hover:text-incorrect"
                      onClick={() =>
                        setDays((list) => list.filter((_, idx) => idx !== i))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={!title.trim() || days.length === 0}
            className="mt-4 w-full rounded-full bg-ink px-6 py-3.5 text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Save plan
          </button>
        </div>
      </PageEnter>
    </div>
  );
}
