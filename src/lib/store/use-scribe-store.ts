"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_VERSION,
  languageForVersion,
  type BibleLanguageId,
  type BibleVersionId,
  type LessonScope,
} from "../bible/types";
import type { CustomPlan, PlanProgress } from "../plans/types";
import {
  rebuildTypingProfile,
  summariesFromSessions,
} from "../coach/profile";
import { buildRulesCoach } from "../coach/rules";
import {
  emptyTypingProfile,
  type MistakeSummary,
  type TypingProfile,
} from "../coach/types";

export type { MistakeSummary, TypingProfile };

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
  /** Aggregate mistake patterns — never raw Scripture. */
  mistakeSummary?: MistakeSummary | null;
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
  language: BibleLanguageId;
  version: BibleVersionId;
  defaultScope: LessonScope;
  passageLength: number;
}

function applyCoachToProfile(profile: TypingProfile): TypingProfile {
  const coach = buildRulesCoach(profile);
  return {
    ...profile,
    narrative: coach.narrative,
    narrativeAt: new Date().toISOString(),
    narrativeSource: "rules",
    suggestedDrill: coach.suggestedDrill,
  };
}

interface ScribeState {
  preferences: Preferences;
  sessions: TypingSession[];
  planProgress: Record<string, PlanProgress>;
  customPlans: CustomPlan[];
  typingProfile: TypingProfile;
  lastSessionId: string | null;
  accountName: string | null;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setLanguage: (language: BibleLanguageId) => void;
  setVersion: (version: BibleVersionId) => void;
  setDefaultScope: (scope: LessonScope) => void;
  setPassageLength: (n: number) => void;
  addSession: (session: TypingSession) => void;
  refreshTypingProfile: () => void;
  setTypingProfileCoach: (patch: {
    narrative: string;
    narrativeSource: "rules" | "ai";
    suggestedDrill: TypingProfile["suggestedDrill"];
  }) => void;
  markPlanDayComplete: (planId: string, day: number) => void;
  addCustomPlan: (plan: CustomPlan) => void;
  removeCustomPlan: (id: string) => void;
  setAccountName: (name: string | null) => void;
  clearHistory: () => void;
  /** Wipe sessions / plans / coach / account — used on sign-out. Prefs kept. */
  resetAccountData: () => void;
  getLocalSnapshot: () => {
    sessions: TypingSession[];
    planProgress: Record<string, PlanProgress>;
    customPlans: CustomPlan[];
    typingProfile: TypingProfile;
  };
  hydrateFromCloud: (payload: {
    accountName: string | null;
    sessions: TypingSession[];
    planProgress: Record<string, PlanProgress>;
    customPlans: CustomPlan[];
    typingProfile?: TypingProfile | null;
  }) => void;
}

const defaultPreferences: Preferences = {
  language: "en",
  version: "web",
  defaultScope: "passage",
  passageLength: 5,
};

function emptyAccountSlice() {
  return {
    sessions: [] as TypingSession[],
    planProgress: {} as Record<string, PlanProgress>,
    customPlans: [] as CustomPlan[],
    typingProfile: emptyTypingProfile(),
    lastSessionId: null as string | null,
    accountName: null as string | null,
  };
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
      preferences: { ...defaultPreferences },
      ...emptyAccountSlice(),
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setLanguage: (language) =>
        set((s) => {
          const currentLang = languageForVersion(s.preferences.version);
          if (language === currentLang) {
            return {
              preferences: { ...s.preferences, language },
            };
          }
          return {
            preferences: {
              ...s.preferences,
              language,
              version: DEFAULT_VERSION[language],
            },
          };
        }),

      setVersion: (version) =>
        set((s) => ({
          preferences: {
            ...s.preferences,
            version,
            language: languageForVersion(version),
          },
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
        set((s) => {
          const sessions = [
            session,
            ...s.sessions.filter((x) => x.id !== session.id),
          ].slice(0, 500);
          const typingProfile = applyCoachToProfile(
            rebuildTypingProfile(
              summariesFromSessions(sessions),
              s.typingProfile,
            ),
          );
          return {
            sessions,
            lastSessionId: session.id,
            typingProfile,
          };
        }),

      refreshTypingProfile: () =>
        set((s) => ({
          typingProfile: applyCoachToProfile(
            rebuildTypingProfile(
              summariesFromSessions(s.sessions),
              s.typingProfile,
            ),
          ),
        })),

      setTypingProfileCoach: (patch) =>
        set((s) => ({
          typingProfile: {
            ...s.typingProfile,
            narrative: patch.narrative,
            narrativeAt: new Date().toISOString(),
            narrativeSource: patch.narrativeSource,
            suggestedDrill: patch.suggestedDrill,
          },
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
          typingProfile: emptyTypingProfile(),
        }),

      resetAccountData: () => set(emptyAccountSlice()),

      getLocalSnapshot: () => {
        const s = get();
        return {
          sessions: s.sessions,
          planProgress: s.planProgress,
          customPlans: s.customPlans,
          typingProfile: s.typingProfile,
        };
      },

      hydrateFromCloud: ({
        accountName,
        sessions,
        planProgress,
        customPlans,
        typingProfile,
      }) =>
        set((s) => {
          const rebuilt = applyCoachToProfile(
            rebuildTypingProfile(
              summariesFromSessions(sessions),
              typingProfile ?? s.typingProfile,
            ),
          );
          // Prefer fresher AI narrative from cloud when present
          const merged =
            typingProfile?.narrativeSource === "ai" && typingProfile.narrative
              ? {
                  ...rebuilt,
                  narrative: typingProfile.narrative,
                  narrativeAt: typingProfile.narrativeAt,
                  narrativeSource: "ai" as const,
                  suggestedDrill:
                    typingProfile.suggestedDrill ?? rebuilt.suggestedDrill,
                }
              : rebuilt;
          return {
            accountName,
            sessions,
            planProgress,
            customPlans,
            typingProfile: merged,
            lastSessionId: sessions[0]?.id ?? null,
          };
        }),
    }),
    {
      // Preferences only — never persist sessions, plans, or coach to the browser.
      name: "scribe-prefs-v1",
      partialize: (state) => ({ preferences: state.preferences }),
      onRehydrateStorage: () => (state) => {
        // Drop legacy full-state cache from earlier builds.
        try {
          localStorage.removeItem("scribe-storage-v1");
        } catch {
          // ignore
        }
        if (state?.preferences) {
          if (!state.preferences.language) {
            state.preferences.language = languageForVersion(
              state.preferences.version,
            );
          } else if (
            languageForVersion(state.preferences.version) !==
            state.preferences.language
          ) {
            state.preferences.version =
              DEFAULT_VERSION[state.preferences.language];
          }
        }
        // Account data must never come from disk.
        if (state) {
          Object.assign(state, emptyAccountSlice());
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
