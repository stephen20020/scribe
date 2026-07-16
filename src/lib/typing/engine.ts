import { normalizeTypingChar } from "./normalize";

function charsMatch(typed: string, expected: string): boolean {
  return normalizeTypingChar(typed) === normalizeTypingChar(expected);
}

export interface TypingSnapshot {
  target: string;
  caret: number;
  typed: string;
  correct: number;
  errors: number;
  totalKeystrokes: number;
  startedAt: number | null;
  finishedAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
  isComplete: boolean;
  isPaused: boolean;
}

export interface LiveStats {
  wpm: number;
  accuracy: number;
  elapsedMs: number;
  charsTyped: number;
  errors: number;
  progress: number;
}

export function createTypingState(target: string): TypingSnapshot {
  return {
    target: [...target].map(normalizeTypingChar).join(""),
    caret: 0,
    typed: "",
    correct: 0,
    errors: 0,
    totalKeystrokes: 0,
    startedAt: null,
    finishedAt: null,
    pausedAt: null,
    pausedMs: 0,
    isComplete: false,
    isPaused: false,
  };
}

function activeElapsed(state: TypingSnapshot, now = Date.now()): number {
  if (!state.startedAt) return 0;
  const end =
    state.finishedAt ??
    (state.isPaused && state.pausedAt ? state.pausedAt : now);
  return Math.max(0, end - state.startedAt - state.pausedMs);
}

/** Characters currently matching the target (source of truth for WPM). */
export function countCorrectChars(state: TypingSnapshot): number {
  const len = Math.min(state.typed.length, state.target.length);
  let n = 0;
  for (let i = 0; i < len; i++) {
    if (charsMatch(state.typed[i], state.target[i])) n += 1;
  }
  return n;
}

export function getLiveStats(
  state: TypingSnapshot,
  now = Date.now(),
): LiveStats {
  const elapsedMs = activeElapsed(state, now);
  const minutes = elapsedMs / 60000;
  const correctChars = countCorrectChars(state);
  const wpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0;
  const accuracy =
    state.totalKeystrokes > 0
      ? Math.round(
          ((state.totalKeystrokes - state.errors) / state.totalKeystrokes) *
            100,
        )
      : 100;

  return {
    wpm,
    accuracy: Math.min(100, Math.max(0, accuracy)),
    elapsedMs,
    charsTyped: state.caret,
    errors: state.errors,
    progress:
      state.target.length > 0
        ? Math.min(1, state.caret / state.target.length)
        : 0,
  };
}

export function handleKey(
  state: TypingSnapshot,
  key: string,
  now = Date.now(),
): TypingSnapshot {
  if (state.isComplete || state.isPaused) return state;

  if (key === "Backspace") {
    if (state.caret === 0) return state;
    const nextCaret = state.caret - 1;
    const removedWasCorrect = charsMatch(
      state.typed[nextCaret] ?? "",
      state.target[nextCaret] ?? "",
    );
    return {
      ...state,
      caret: nextCaret,
      typed: state.typed.slice(0, nextCaret),
      // Rewind correct count when deleting a previously correct char.
      // errors/totalKeystrokes stay cumulative.
      correct: removedWasCorrect
        ? Math.max(0, state.correct - 1)
        : state.correct,
    };
  }

  if (key.length !== 1) return state;

  const startedAt = state.startedAt ?? now;
  const expected = state.target[state.caret];
  const isCorrect = charsMatch(key, expected);
  const nextCaret = state.caret + 1;
  const typed = state.typed + key;
  const correct = state.correct + (isCorrect ? 1 : 0);
  const errors = state.errors + (isCorrect ? 0 : 1);
  const totalKeystrokes = state.totalKeystrokes + 1;
  const isComplete = nextCaret >= state.target.length;

  return {
    ...state,
    startedAt,
    caret: nextCaret,
    typed,
    correct,
    errors,
    totalKeystrokes,
    isComplete,
    finishedAt: isComplete ? now : null,
  };
}

export function togglePause(
  state: TypingSnapshot,
  now = Date.now(),
): TypingSnapshot {
  if (state.isComplete) return state;

  if (state.isPaused) {
    return {
      ...state,
      isPaused: false,
      pausedMs:
        state.startedAt && state.pausedAt
          ? state.pausedMs + (now - state.pausedAt)
          : state.pausedMs,
      pausedAt: null,
    };
  }

  return {
    ...state,
    isPaused: true,
    // Only run the pause clock once typing has started
    pausedAt: state.startedAt ? now : null,
  };
}

export function pauseTyping(
  state: TypingSnapshot,
  now = Date.now(),
): TypingSnapshot {
  if (state.isComplete || state.isPaused) return state;
  return togglePause(state, now);
}

export function resumeTyping(
  state: TypingSnapshot,
  now = Date.now(),
): TypingSnapshot {
  if (state.isComplete || !state.isPaused) return state;
  return togglePause(state, now);
}
