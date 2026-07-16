"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BibleVersionId, LessonScope } from "../bible/types";
import type { CustomPlan, PlanProgress } from "../plans/types";

export interface TypingSession {
  id: string;
  version: BibleVersionId;
  referenceLabel: string;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  scope: LessonScope;
  wpm: number;
  accuracy: number;
  durationMs: number;
  charsTyped: number;
  errors: number;
  versesCompleted: number;
  completedAt: string;
  planId?: string;
  planDay?: number;
}

/** Deep-link back into the same lesson (skips the scripture picker). */
export function typingSessionHref(session: TypingSession): string {
  if (session.book === "Practice") {
    return "/warm-up";
  }
  const passage = Math.max(1, session.endVerse - session.startVerse + 1);
  const params = new URLSearchParams({
    version: session.version,
    book: session.book,
    chapter: String(session.chapter),
    verse: String(session.startVerse),
    scope: session.scope,
    passage: String(passage),
    go: "1",
  });
  if (session.planId) params.set("planId", session.planId);
  if (session.planDay != null) params.set("planDay", String(session.planDay));
  return `/type?${params.toString()}`;
}

export interface Preferences {
  version: BibleVersionId;
  defaultScope: LessonScope;
  passageLength: number;
}

interface ScribeState {
  preferences: Preferences;
  sessions: TypingSession[];
  planProgress: Record<string, PlanProgress>;
  customPlans: CustomPlan[];
  lastSessionId: string | null;
  accountName: string | null;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setVersion: (version: BibleVersionId) => void;
  setDefaultScope: (scope: LessonScope) => void;
  setPassageLength: (n: number) => void;
  addSession: (session: TypingSession) => void;
  markPlanDayComplete: (planId: string, day: number) => void;
  addCustomPlan: (plan: CustomPlan) => void;
  removeCustomPlan: (id: string) => void;
  setAccountName: (name: string | null) => void;
  clearHistory: () => void;
  getLocalSnapshot: () => {
    sessions: TypingSession[];
    planProgress: Record<string, PlanProgress>;
    customPlans: CustomPlan[];
  };
  hydrateFromCloud: (payload: {
    accountName: string | null;
    sessions: TypingSession[];
    planProgress: Record<string, PlanProgress>;
    customPlans: CustomPlan[];
  }) => void;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function computeAggregates(sessions: TypingSession[]) {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalVerses: 0,
      totalTimeMs: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      currentStreak: 0,
      lastSessionAt: null as string | null,
    };
  }

  const totalVerses = sessions.reduce((s, x) => s + x.versesCompleted, 0);
  const totalTimeMs = sessions.reduce((s, x) => s + x.durationMs, 0);
  const avgWpm = Math.round(
    sessions.reduce((s, x) => s + x.wpm, 0) / sessions.length,
  );
  const avgAccuracy = Math.round(
    sessions.reduce((s, x) => s + x.accuracy, 0) / sessions.length,
  );

  const days = new Set(sessions.map((s) => dayKey(s.completedAt)));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak += 1;
    else if (i === 0) continue;
    else break;
  }

  return {
    totalSessions: sessions.length,
    totalVerses,
    totalTimeMs,
    avgWpm,
    avgAccuracy,
    currentStreak: streak,
    lastSessionAt: sessions[0]?.completedAt ?? null,
  };
}

export const useScribeStore = create<ScribeState>()(
  persist(
    (set, get) => ({
      preferences: {
        version: "web",
        defaultScope: "passage",
        passageLength: 5,
      },
      sessions: [],
      planProgress: {},
      customPlans: [],
      lastSessionId: null,
      accountName: null,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setVersion: (version) =>
        set((s) => ({
          preferences: { ...s.preferences, version },
        })),

      setDefaultScope: (scope) =>
        set((s) => ({
          preferences: { ...s.preferences, defaultScope: scope },
        })),

      setPassageLength: (n) =>
        set((s) => ({
          preferences: {
            ...s.preferences,
            passageLength: Math.min(20, Math.max(2, n)),
          },
        })),

      addSession: (session) =>
        set((s) => ({
          sessions: [session, ...s.sessions.filter((x) => x.id !== session.id)].slice(
            0,
            500,
          ),
          lastSessionId: session.id,
        })),

      markPlanDayComplete: (planId, day) =>
        set((s) => {
          const prev = s.planProgress[planId] ?? {
            planId,
            completedDays: [],
            lastCompletedAt: null,
          };
          const completedDays = prev.completedDays.includes(day)
            ? prev.completedDays
            : [...prev.completedDays, day].sort((a, b) => a - b);
          return {
            planProgress: {
              ...s.planProgress,
              [planId]: {
                planId,
                completedDays,
                lastCompletedAt: new Date().toISOString(),
              },
            },
          };
        }),

      addCustomPlan: (plan) =>
        set((s) => ({
          customPlans: [plan, ...s.customPlans.filter((p) => p.id !== plan.id)],
        })),

      removeCustomPlan: (id) =>
        set((s) => ({
          customPlans: s.customPlans.filter((p) => p.id !== id),
          planProgress: Object.fromEntries(
            Object.entries(s.planProgress).filter(([k]) => k !== id),
          ),
        })),

      setAccountName: (name) => set({ accountName: name }),

      clearHistory: () =>
        set({
          sessions: [],
          lastSessionId: null,
        }),

      getLocalSnapshot: () => {
        const s = get();
        return {
          sessions: s.sessions,
          planProgress: s.planProgress,
          customPlans: s.customPlans,
        };
      },

      hydrateFromCloud: ({
        accountName,
        sessions,
        planProgress,
        customPlans,
      }) =>
        set({
          accountName,
          sessions,
          planProgress,
          customPlans,
          lastSessionId: sessions[0]?.id ?? null,
        }),
    }),
    {
      name: "scribe-storage-v1",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
