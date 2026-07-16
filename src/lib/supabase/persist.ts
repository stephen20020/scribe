"use client";

import type { CustomPlan } from "@/lib/plans/types";
import {
  useScribeStore,
  type TypingSession,
} from "@/lib/store/use-scribe-store";
import { createClient } from "./client";
import {
  deleteCustomPlanRemote,
  pushCustomPlan,
  pushPlanProgress,
  pushSession,
} from "./sync";

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function saveSession(session: TypingSession) {
  useScribeStore.getState().addSession(session);
  const userId = await currentUserId();
  if (userId) {
    await pushSession(userId, session).catch(() => {});
    if (session.planId && session.planDay) {
      // Local mark already done by caller in some paths; ensure cloud has progress
      const progress = useScribeStore.getState().planProgress[session.planId];
      if (progress) {
        await pushPlanProgress(userId, progress).catch(() => {});
      }
    }
  }
}

export async function savePlanDayComplete(planId: string, day: number) {
  useScribeStore.getState().markPlanDayComplete(planId, day);
  const userId = await currentUserId();
  if (!userId) return;
  const progress = useScribeStore.getState().planProgress[planId];
  if (progress) await pushPlanProgress(userId, progress).catch(() => {});
}

export async function saveCustomPlan(plan: CustomPlan) {
  useScribeStore.getState().addCustomPlan(plan);
  const userId = await currentUserId();
  if (userId) await pushCustomPlan(userId, plan).catch(() => {});
}

export async function removeCustomPlan(planId: string) {
  useScribeStore.getState().removeCustomPlan(planId);
  const userId = await currentUserId();
  if (userId) await deleteCustomPlanRemote(userId, planId).catch(() => {});
}
