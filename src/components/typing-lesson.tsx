"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { loadBible } from "@/lib/bible/load";
import { buildLessonTarget } from "@/lib/bible/references";
import { localizeBookName } from "@/lib/bible/books";
import {
  BIBLE_LANGUAGES,
  DEFAULT_VERSION,
  languageForVersion,
  versionsForLanguage,
  type BibleLanguageId,
  type BibleVersionId,
  type LessonScope,
  type LessonTarget,
} from "@/lib/bible/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import {
  createTypingState,
  getLiveStats,
  handleKey,
  pauseTyping,
  resumeTyping,
  type LiveStats,
  type TypingSnapshot,
} from "@/lib/typing/engine";
import { charClassName, paintChar, scrollCaretIntoBand } from "@/lib/typing/dom";
import {
  normalizeTypingChar,
  normalizeTypingText,
} from "@/lib/typing/normalize";
import { RandomVerseButton } from "@/components/random-verse-button";
import { createMistakeTracker } from "@/lib/coach/tracker";
import { savePlanDayComplete, saveSession } from "@/lib/supabase/persist";
import { formatDuration, uid, cn } from "@/lib/utils";

const STATS_MS = 100;
const BURST_MS = 48;

function isOtherTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    const type = target.type;
    return !["button", "submit", "checkbox", "radio", "reset", "file"].includes(
      type,
    );
  }
  return target.isContentEditable;
}

export function TypingLesson({
  version,
  book,
  chapter,
  verse,
  scope,
  passageLength,
  planId,
  planDay,
  practiceText,
  practiceLabel,
  isRandom = false,
}: {
  version: BibleVersionId;
  book: string;
  chapter: number;
  verse: number;
  scope: LessonScope;
  passageLength: number;
  planId?: string;
  planDay?: number;
  practiceText?: string;
  practiceLabel?: string;
  isRandom?: boolean;
}) {
  const router = useRouter();
  const setPreferredVersion = useScribeStore((s) => s.setVersion);
  const setPreferredLanguage = useScribeStore((s) => s.setLanguage);
  const language = languageForVersion(version);
  const versions = versionsForLanguage(language);

  const [target, setTarget] = useState<LessonTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [live, setLive] = useState<LiveStats | null>(null);
  const [ready, setReady] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const stateRef = useRef<TypingSnapshot | null>(null);
  const targetRef = useRef<LessonTarget | null>(null);
  const charElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const mistakeTrackerRef = useRef(createMistakeTracker());
  const confirmEndRef = useRef(false);
  const suppressInputRef = useRef(false);
  const handledBeforeInputRef = useRef(false);
  const lastKeyAtRef = useRef(0);
  const statsTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    confirmEndRef.current = confirmEnd;
  }, [confirmEnd]);

  const focusLesson = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  /** Keep toolbar clicks from stealing focus (and dismissing the soft keyboard). */
  const retainFocus = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
  }, []);

  const syncStats = useCallback((snapshot: TypingSnapshot) => {
    const stats = getLiveStats(snapshot);
    setLive(stats);
    if (progressRef.current) {
      progressRef.current.style.width = `${stats.progress * 100}%`;
    }
  }, []);

  const scheduleStats = useCallback(
    (snapshot: TypingSnapshot) => {
      if (statsTimerRef.current != null) return;
      statsTimerRef.current = window.setTimeout(() => {
        statsTimerRef.current = null;
        if (stateRef.current) syncStats(stateRef.current);
      }, STATS_MS);
      // Keep a cheap progress tick even between stat flushes
      const stats = getLiveStats(snapshot);
      if (progressRef.current) {
        progressRef.current.style.width = `${stats.progress * 100}%`;
      }
    },
    [syncStats],
  );

  const scheduleScroll = useCallback((caretIndex: number) => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const scroller = scrollerRef.current;
      const caret = charElsRef.current[caretIndex];
      if (!scroller || !caret) return;
      const burst = Date.now() - lastKeyAtRef.current < BURST_MS;
      scrollCaretIntoBand(scroller, caret, { smooth: !burst });
    });
  }, []);

  const flashWrong = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.classList.add("typing-stage-wrong");
    if (flashTimerRef.current != null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      stage.classList.remove("typing-stage-wrong");
      flashTimerRef.current = null;
    }, 90);
  }, []);

  const saveAndLeave = useCallback(
    (
      finalState: TypingSnapshot,
      lesson: LessonTarget,
      opts: { completed: boolean },
    ) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const stats = getLiveStats(finalState);
      const sessionId = uid("session");
      const versesCompleted = opts.completed
        ? lesson.verses.length
        : Math.max(0, Math.floor(stats.progress * lesson.verses.length));

      const session = {
        id: sessionId,
        version: lesson.version,
        referenceLabel: lesson.referenceLabel,
        book: lesson.book,
        chapter: lesson.chapter,
        startVerse: lesson.startVerse,
        endVerse: lesson.endVerse,
        scope: lesson.scope,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        durationMs: stats.elapsedMs,
        charsTyped: stats.charsTyped,
        errors: stats.errors,
        versesCompleted,
        completedAt: new Date().toISOString(),
        planId,
        planDay,
        mistakeSummary: mistakeTrackerRef.current.summarize(),
      };

      void (async () => {
        if (opts.completed && planId && planDay) {
          await savePlanDayComplete(planId, planDay);
        }
        await saveSession(session);
      })();

      router.push(`/stats?session=${sessionId}`);
    },
    [planDay, planId, router],
  );

  useEffect(() => {
    let cancelled = false;
    finishedRef.current = false;
    charElsRef.current = [];

    function startLesson(lesson: LessonTarget) {
      if (cancelled) return;
      mistakeTrackerRef.current.reset();
      const snapshot = createTypingState(lesson.text);
      stateRef.current = snapshot;
      targetRef.current = lesson;
      setTarget(lesson);
      setIsPaused(false);
      setConfirmEnd(false);
      setError(null);
      setLive(getLiveStats(snapshot));
      setReady(true);
    }

    if (practiceText && practiceLabel) {
      const text = normalizeTypingText(practiceText);
      startLesson({
        version,
        book: "Practice",
        chapter: 1,
        startVerse: 1,
        endVerse: 1,
        scope: "verse",
        verses: [{ verse: 1, text }],
        text,
        referenceLabel: practiceLabel,
      });
      return () => {
        cancelled = true;
        if (statsTimerRef.current != null) window.clearTimeout(statsTimerRef.current);
        if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
        if (flashTimerRef.current != null) window.clearTimeout(flashTimerRef.current);
      };
    }

    loadBible(version)
      .then((bible) => {
        if (cancelled) return;
        const lesson = buildLessonTarget(bible, {
          book,
          chapter,
          startVerse: verse,
          scope,
          passageLength,
        });
        if (!lesson) {
          setError("Could not build that lesson.");
          return;
        }
        startLesson(lesson);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load scripture.");
      });

    return () => {
      cancelled = true;
      if (statsTimerRef.current != null) window.clearTimeout(statsTimerRef.current);
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
      if (flashTimerRef.current != null) window.clearTimeout(flashTimerRef.current);
    };
  }, [version, book, chapter, verse, scope, passageLength, practiceText, practiceLabel]);

  // Paint initial caret once spans mount
  useEffect(() => {
    if (!ready || !target) return;
    const els = charElsRef.current;
    for (let i = 0; i < target.text.length; i++) {
      paintChar(els[i], i === 0 ? "current" : "pending", /\s/.test(target.text[i]));
    }
    focusLesson();
    scheduleScroll(0);
  }, [ready, target, focusLesson, scheduleScroll]);

  // Clock tick while actively typing — cheap, does not touch character DOM
  useEffect(() => {
    if (!ready || isPaused) return;
    const id = window.setInterval(() => {
      const snap = stateRef.current;
      if (!snap?.startedAt || snap.isComplete || snap.isPaused) return;
      syncStats(snap);
    }, 250);
    return () => window.clearInterval(id);
  }, [ready, isPaused, syncStats]);

  const applyKey = useCallback(
    (key: string) => {
      const prev = stateRef.current;
      const lesson = targetRef.current;
      if (!prev || !lesson || prev.isPaused || prev.isComplete) return;

      const next = handleKey(prev, key);
      if (next === prev) return;

      lastKeyAtRef.current = Date.now();

      const oldCaret = prev.caret;
      const newCaret = next.caret;
      const els = charElsRef.current;

      if (key === "Backspace") {
        paintChar(els[oldCaret], "pending", /\s/.test(prev.target[oldCaret] ?? ""));
        paintChar(
          els[newCaret],
          "current",
          /\s/.test(next.target[newCaret] ?? ""),
        );
      } else {
        const wasCorrect =
          normalizeTypingChar(next.typed[oldCaret] ?? "") ===
          normalizeTypingChar(next.target[oldCaret] ?? "");
        if (!wasCorrect) {
          const expected = next.target[oldCaret] ?? "";
          const typed = next.typed[oldCaret] ?? "";
          const atMs = Math.max(
            0,
            Date.now() - (next.startedAt ?? Date.now()) - next.pausedMs,
          );
          mistakeTrackerRef.current.record({
            expected,
            typed,
            prev: oldCaret > 0 ? (next.target[oldCaret - 1] ?? null) : null,
            atMs,
            index: oldCaret,
          });
          flashWrong();
        }
        paintChar(
          els[oldCaret],
          wasCorrect ? "correct" : "incorrect",
          /\s/.test(next.target[oldCaret] ?? ""),
        );
        if (!next.isComplete) {
          paintChar(
            els[newCaret],
            "current",
            /\s/.test(next.target[newCaret] ?? ""),
          );
        }
      }

      stateRef.current = next;
      scheduleStats(next);
      scheduleScroll(Math.min(newCaret, next.target.length - 1));

      if (next.isComplete) {
        syncStats(next);
        saveAndLeave(next, lesson, { completed: true });
      }
    },
    [flashWrong, saveAndLeave, scheduleScroll, scheduleStats, syncStats],
  );

  const onPause = () => {
    const snap = stateRef.current;
    if (!snap || snap.isPaused) return;
    const next = pauseTyping(snap);
    stateRef.current = next;
    setIsPaused(true);
    setConfirmEnd(false);
    syncStats(next);
    inputRef.current?.blur();
  };

  const onResume = () => {
    const snap = stateRef.current;
    if (!snap || !snap.isPaused) return;
    const next = resumeTyping(snap);
    stateRef.current = next;
    setIsPaused(false);
    setConfirmEnd(false);
    syncStats(next);
    requestAnimationFrame(focusLesson);
  };

  const onEnd = () => {
    const snap = stateRef.current;
    const lesson = targetRef.current;
    if (!snap || !lesson) return;

    if (!snap.startedAt && snap.caret === 0) {
      if (practiceText) router.push("/dashboard");
      else window.location.assign("/type");
      return;
    }

    if (!confirmEnd) {
      if (!snap.isPaused) {
        const paused = pauseTyping(snap);
        stateRef.current = paused;
        setIsPaused(true);
      }
      setConfirmEnd(true);
      return;
    }

    saveAndLeave(snap, lesson, { completed: snap.isComplete });
  };

  const consumeTypedText = useCallback(
    (value: string) => {
      if (!value || !stateRef.current || stateRef.current.isPaused) return;
      if (confirmEndRef.current) setConfirmEnd(false);
      for (const ch of value) {
        if (ch === "\n" || ch === "\r") continue;
        applyKey(ch);
      }
    },
    [applyKey, setConfirmEnd],
  );

  // Physical keyboard: window listener so typing still works if focus drifts.
  // Soft keyboard: beforeinput/input on the capture textarea (deduped below).
  useEffect(() => {
    if (!ready) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (finishedRef.current) return;

      const snap = stateRef.current;
      if (!snap) return;

      if (e.target !== inputRef.current && isOtherTextField(e.target)) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (confirmEndRef.current) {
          setConfirmEnd(false);
          return;
        }
        if (snap.isPaused) {
          const next = resumeTyping(snap);
          stateRef.current = next;
          setIsPaused(false);
          setConfirmEnd(false);
          syncStats(next);
          requestAnimationFrame(focusLesson);
        } else {
          const next = pauseTyping(snap);
          stateRef.current = next;
          setIsPaused(true);
          setConfirmEnd(false);
          syncStats(next);
          inputRef.current?.blur();
        }
        return;
      }

      if (snap.isPaused) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        suppressInputRef.current = true;
        if (confirmEndRef.current) setConfirmEnd(false);
        applyKey("Backspace");
        return;
      }

      if (
        e.key.length === 1 &&
        e.key !== "Unidentified" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        suppressInputRef.current = true;
        if (confirmEndRef.current) setConfirmEnd(false);
        applyKey(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ready, applyKey, focusLesson, syncStats]);

  const onBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const ne = e.nativeEvent as InputEvent;
    const el = e.currentTarget;

    if (suppressInputRef.current) {
      e.preventDefault();
      suppressInputRef.current = false;
      el.value = "";
      return;
    }

    if (
      ne.inputType === "deleteContentBackward" ||
      ne.inputType === "deleteContentForward" ||
      ne.inputType === "deleteByCut" ||
      ne.inputType === "deleteByDrag"
    ) {
      e.preventDefault();
      handledBeforeInputRef.current = true;
      queueMicrotask(() => {
        handledBeforeInputRef.current = false;
      });
      el.value = "";
      if (!stateRef.current || stateRef.current.isPaused) return;
      if (confirmEndRef.current) setConfirmEnd(false);
      applyKey("Backspace");
      return;
    }

    if (ne.data) {
      e.preventDefault();
      handledBeforeInputRef.current = true;
      queueMicrotask(() => {
        handledBeforeInputRef.current = false;
      });
      el.value = "";
      consumeTypedText(ne.data);
    }
  };

  const onCaptureInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (suppressInputRef.current || handledBeforeInputRef.current) {
      suppressInputRef.current = false;
      handledBeforeInputRef.current = false;
      el.value = "";
      return;
    }
    const value = el.value;
    el.value = "";
    // Fallback for browsers that skip beforeinput.
    consumeTypedText(value);
  };

  /** Stable token structure — rebuilt only when the passage text changes. */
  const tokens = useMemo(() => {
    if (!target) return [];
    const text = target.text;
    const groups: { key: string; start: number; chars: string }[] = [];
    let wordStart = -1;
    let word = "";

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (/\s/.test(ch)) {
        if (wordStart >= 0) {
          groups.push({ key: `w-${wordStart}`, start: wordStart, chars: word });
          wordStart = -1;
          word = "";
        }
        groups.push({ key: `s-${i}`, start: i, chars: ch });
      } else {
        if (wordStart < 0) wordStart = i;
        word += ch;
      }
    }
    if (wordStart >= 0) {
      groups.push({ key: `w-${wordStart}`, start: wordStart, chars: word });
    }
    return groups;
  }, [target]);

  if (error) {
    return (
      <p className="text-center text-incorrect" role="alert">
        {error}
      </p>
    );
  }

  if (!target || !ready || !live) {
    return (
      <p className="text-center text-ink-muted">Preparing your lesson…</p>
    );
  }

  function goToLesson(nextVersion: BibleVersionId, nextBook = book) {
    const params = new URLSearchParams({
      version: nextVersion,
      book: localizeBookName(nextBook, languageForVersion(nextVersion)),
      chapter: String(chapter),
      verse: String(verse),
      scope,
      passage: String(passageLength),
      go: "1",
    });
    if (planId) params.set("planId", planId);
    if (planDay != null) params.set("planDay", String(planDay));
    if (isRandom) params.set("random", "1");
    // Hard navigate: soft router.push on /type often leaves search params stuck.
    window.location.assign(`/type?${params.toString()}`);
  }

  function switchLanguage(next: BibleLanguageId) {
    if (next === language) return;
    const nextVersion = DEFAULT_VERSION[next];
    setPreferredLanguage(next);
    setPreferredVersion(nextVersion);
    goToLesson(nextVersion, book);
  }

  function switchVersion(next: BibleVersionId) {
    if (next === version) return;
    setPreferredVersion(next);
    goToLesson(next, book);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
            {target.scope}
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
            {target.referenceLabel}
          </h1>
          {!practiceText && (
            <div className="mt-3 space-y-2">
              <div
                className="inline-flex rounded-full border border-line p-0.5"
                role="group"
                aria-label="Language"
              >
                {BIBLE_LANGUAGES.map((lang) => {
                  const selected = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      aria-pressed={selected}
                      title={lang.label}
                      onClick={() => switchLanguage(lang.id)}
                      className={cn(
                        "rounded-full px-3 py-1 font-mono text-[11px] tracking-wider uppercase transition",
                        selected
                          ? "bg-ink text-bg"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {lang.short}
                    </button>
                  );
                })}
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Translation"
              >
                {versions.map((v) => {
                  const selected = version === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={selected}
                      title={`${v.name} — switches version and restarts the lesson`}
                      onClick={() => switchVersion(v.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wider uppercase transition",
                        selected
                          ? "border-accent bg-accent-soft text-ink"
                          : "border-line text-ink-muted hover:text-ink",
                      )}
                    >
                      {v.short}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-xs tracking-wide text-ink-muted uppercase">
          <Stat label="WPM" value={String(live.wpm)} />
          <Stat label="Acc" value={`${live.accuracy}%`} />
          <Stat label="Time" value={formatDuration(live.elapsedMs)} />
          <Stat label="Err" value={String(live.errors)} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isPaused ? (
          <button
            type="button"
            onMouseDown={retainFocus}
            onClick={onResume}
            className="rounded-full bg-ink px-5 py-2 text-sm text-bg transition hover:opacity-90"
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={retainFocus}
            onClick={onPause}
            className="rounded-full border border-line px-5 py-2 text-sm text-ink-muted transition hover:text-ink"
          >
            Pause
          </button>
        )}

        {!confirmEnd ? (
          <button
            type="button"
            onMouseDown={retainFocus}
            onClick={onEnd}
            className="rounded-full border border-line px-5 py-2 text-sm text-ink-muted transition hover:text-incorrect"
          >
            End
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-muted">End and save progress?</span>
            <button
              type="button"
              onMouseDown={retainFocus}
              onClick={onEnd}
              className="rounded-full bg-incorrect/90 px-4 py-2 text-sm text-bg"
            >
              End session
            </button>
            <button
              type="button"
              onMouseDown={retainFocus}
              onClick={() => {
                setConfirmEnd(false);
                onResume();
              }}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink-muted hover:text-ink"
            >
              Keep going
            </button>
          </div>
        )}

        {isRandom && (
          <span onMouseDown={retainFocus}>
            <RandomVerseButton
              version={version}
              replace
              label={language === "es" ? "Otro versículo" : "Another verse"}
              className="rounded-full border border-line px-5 py-2 text-sm text-ink-muted transition hover:text-ink"
            />
          </span>
        )}

        <button
          type="button"
          onMouseDown={retainFocus}
          onClick={focusLesson}
          className={cn(
            "rounded-full border px-5 py-2 text-sm transition sm:hidden",
            inputFocused
              ? "border-accent bg-accent-soft text-ink"
              : "border-line text-ink-muted hover:text-ink",
          )}
        >
          {inputFocused ? "Keyboard ready" : "Open keyboard"}
        </button>
      </div>

      <div
        ref={stageRef}
        onClick={focusLesson}
        className="typing-stage relative outline-none"
      >
        <textarea
          ref={inputRef}
          className="typing-capture"
          aria-label="Type the passage"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="next"
          rows={1}
          tabIndex={0}
          onBeforeInput={onBeforeInput}
          onInput={onCaptureInput}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        <div
          ref={scrollerRef}
          className="typing-scroller"
          aria-label="Typing passage"
        >
          <p className="typing-text font-mono text-[1.15rem] leading-[1.85] sm:text-[1.35rem] sm:leading-[1.9]">
            {tokens.map((token) => {
              const isSpace = token.chars.length === 1 && /\s/.test(token.chars);
              return (
                <span
                  key={token.key}
                  className={cn(!isSpace && "whitespace-nowrap")}
                >
                  {Array.from(token.chars).map((ch, offset) => {
                    const i = token.start + offset;
                    return (
                      <span
                        key={i}
                        ref={(el) => {
                          charElsRef.current[i] = el;
                        }}
                        className={charClassName(
                          i === 0 ? "current" : "pending",
                          /\s/.test(ch),
                        )}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </p>
        </div>

        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-bg/75 backdrop-blur-[2px]"
          >
            <p className="font-display text-2xl text-ink">Paused</p>
            <button
              type="button"
              onClick={onResume}
              className="rounded-full bg-ink px-6 py-2.5 text-sm text-bg"
            >
              Resume
            </button>
            <p className="text-xs text-ink-faint">Esc to resume</p>
          </motion.div>
        )}
      </div>

      <div className="mt-6">
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div
            ref={progressRef}
            className="h-full bg-accent transition-[width] duration-100 ease-out"
            style={{ width: `${live.progress * 100}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-ink-faint">
          <span className="sm:hidden">
            Tap Open keyboard (or the verse) to type. Backspace corrects.
          </span>
          <span className="hidden sm:inline">
            The line stays in the focus band as you type. Esc pauses ·
            Backspace corrects.
          </span>
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-ink-faint">{label}</div>
      <div className="mt-0.5 text-base tracking-normal text-ink normal-case">
        {value}
      </div>
    </div>
  );
}
