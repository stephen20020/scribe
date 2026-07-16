"use client";

import type { CustomPlan, PlanProgress } from "@/lib/plans/types";
import type {
  TypingProfile,
  TypingSession,
} from "@/lib/store/use-scribe-store";
import { parseMistakeSummary, parseTypingProfile } from "@/lib/coach/validate";
import { createClient } from "./client";

type SessionRow = {
  id: string;
  version: string;
  reference_label: string;
  book: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
  scope: string;
  wpm: number;
  accuracy: number;
  duration_ms: number;
  chars_typed: number;
  errors: number;
  verses_completed: number;
  completed_at: string;
  plan_id: string | null;
  plan_day: number | null;
  mistake_summary?: unknown;
};

function toSession(row: SessionRow): TypingSession {
  return {
    id: row.id,
    version: row.version as TypingSession["version"],
    referenceLabel: row.reference_label,
    book: row.book,
    chapter: row.chapter,
    startVerse: row.start_verse,
    endVerse: row.end_verse,
    scope: row.scope as TypingSession["scope"],
    wpm: row.wpm,
    accuracy: row.accuracy,
    durationMs: row.duration_ms,
    charsTyped: row.chars_typed,
    errors: row.errors,
    versesCompleted: row.verses_completed,
    completedAt: row.completed_at,
    planId: row.plan_id ?? undefined,
    planDay: row.plan_day ?? undefined,
    mistakeSummary: parseMistakeSummary(row.mistake_summary),
  };
}

export async function fetchAccountBundle(userId: string): Promise<{
  displayName: string | null;
  sessions: TypingSession[];
  planProgress: Record<string, PlanProgress>;
  customPlans: CustomPlan[];
  typingProfile: TypingProfile | null;
}> {
  const supabase = createClient();

  const [profileRes, sessionsRes, progressRes, plansRes, typingProfileRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("typing_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(500),
      supabase.from("plan_progress").select("*").eq("user_id", userId),
      supabase
        .from("custom_plans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("typing_profiles")
        .select("profile")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const planProgress: Record<string, PlanProgress> = {};
  for (const row of progressRes.data ?? []) {
    planProgress[row.plan_id] = {
      planId: row.plan_id,
      completedDays: row.completed_days ?? [],
      lastCompletedAt: row.last_completed_at,
    };
  }

  const customPlans: CustomPlan[] = (plansRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    createdAt: row.created_at,
    days: row.days ?? [],
    isCustom: true as const,
  }));

  return {
    displayName: profileRes.data?.display_name ?? null,
    sessions: (sessionsRes.data ?? []).map((row) =>
      toSession(row as SessionRow),
    ),
    planProgress,
    customPlans,
    typingProfile: parseTypingProfile(typingProfileRes.data?.profile),
  };
}

export async function upsertProfile(userId: string, displayName: string) {
  const supabase = createClient();
  await supabase.from("profiles").upsert({
    id: userId,
    display_name: displayName,
  });
}

export async function pushSession(userId: string, session: TypingSession) {
  const supabase = createClient();
  const { error } = await supabase.from("typing_sessions").upsert({
    id: session.id,
    user_id: userId,
    version: session.version,
    reference_label: session.referenceLabel,
    book: session.book,
    chapter: session.chapter,
    start_verse: session.startVerse,
    end_verse: session.endVerse,
    scope: session.scope,
    wpm: session.wpm,
    accuracy: session.accuracy,
    duration_ms: session.durationMs,
    chars_typed: session.charsTyped,
    errors: session.errors,
    verses_completed: session.versesCompleted,
    completed_at: session.completedAt,
    plan_id: session.planId ?? null,
    plan_day: session.planDay ?? null,
    mistake_summary: session.mistakeSummary ?? null,
  });
  if (error) throw error;
}

export async function pushSessions(userId: string, sessions: TypingSession[]) {
  if (sessions.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.from("typing_sessions").upsert(
    sessions.map((session) => ({
      id: session.id,
      user_id: userId,
      version: session.version,
      reference_label: session.referenceLabel,
      book: session.book,
      chapter: session.chapter,
      start_verse: session.startVerse,
      end_verse: session.endVerse,
      scope: session.scope,
      wpm: session.wpm,
      accuracy: session.accuracy,
      duration_ms: session.durationMs,
      chars_typed: session.charsTyped,
      errors: session.errors,
      verses_completed: session.versesCompleted,
      completed_at: session.completedAt,
      plan_id: session.planId ?? null,
      plan_day: session.planDay ?? null,
      mistake_summary: session.mistakeSummary ?? null,
    })),
  );
  if (error) throw error;
}

export async function pushTypingProfile(
  userId: string,
  profile: TypingProfile,
) {
  const supabase = createClient();
  const { error } = await supabase.from("typing_profiles").upsert({
    user_id: userId,
    profile,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function pushPlanProgress(userId: string, progress: PlanProgress) {
  const supabase = createClient();
  const { error } = await supabase.from("plan_progress").upsert({
    user_id: userId,
    plan_id: progress.planId,
    completed_days: progress.completedDays,
    last_completed_at: progress.lastCompletedAt,
  });
  if (error) throw error;
}

export async function pushCustomPlan(userId: string, plan: CustomPlan) {
  const supabase = createClient();
  const { error } = await supabase.from("custom_plans").upsert({
    id: plan.id,
    user_id: userId,
    title: plan.title,
    description: plan.description,
    days: plan.days,
    created_at: plan.createdAt,
  });
  if (error) throw error;
}

export async function deleteCustomPlanRemote(userId: string, planId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("custom_plans")
    .delete()
    .eq("user_id", userId)
    .eq("id", planId);
  if (error) throw error;
}
