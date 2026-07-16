import { NextResponse } from "next/server";
import { buildRulesCoach } from "@/lib/coach/rules";
import { drillHref, drillLabel } from "@/lib/coach/drill";
import type { TypingProfile } from "@/lib/coach/types";
import { emptyTypingProfile } from "@/lib/coach/types";

export const runtime = "nodejs";

type ProfilePayload = Pick<
  TypingProfile,
  | "sessionsSampled"
  | "topPairs"
  | "topBigrams"
  | "weakChars"
  | "earlyErrors"
  | "lateErrors"
  | "punctuationErrors"
  | "totalMistakes"
>;

function sanitizeProfile(body: unknown): ProfilePayload | null {
  if (!body || typeof body !== "object") return null;
  const profile = (body as { profile?: unknown }).profile;
  if (!profile || typeof profile !== "object") return null;
  const p = profile as Record<string, unknown>;

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const pairs = Array.isArray(p.topPairs)
    ? p.topPairs
        .filter(
          (x): x is { key: string; count: number; trend: "up" | "down" | "flat" } =>
            !!x &&
            typeof x === "object" &&
            typeof (x as { key?: unknown }).key === "string" &&
            typeof (x as { count?: unknown }).count === "number",
        )
        .slice(0, 12)
        .map((x) => ({
          key: String(x.key).slice(0, 24),
          count: Math.min(10_000, Math.max(0, x.count)),
          trend: (["up", "down", "flat"].includes(String(x.trend))
            ? x.trend
            : "flat") as "up" | "down" | "flat",
        }))
    : [];

  return {
    sessionsSampled: Math.min(500, Math.max(0, num(p.sessionsSampled))),
    topPairs: pairs,
    topBigrams: Array.isArray(p.topBigrams)
      ? (p.topBigrams as TypingProfile["topBigrams"]).slice(0, 8)
      : [],
    weakChars: Array.isArray(p.weakChars)
      ? (p.weakChars as TypingProfile["weakChars"]).slice(0, 8)
      : [],
    earlyErrors: Math.min(50_000, Math.max(0, num(p.earlyErrors))),
    lateErrors: Math.min(50_000, Math.max(0, num(p.lateErrors))),
    punctuationErrors: Math.min(50_000, Math.max(0, num(p.punctuationErrors))),
    totalMistakes: Math.min(100_000, Math.max(0, num(p.totalMistakes))),
  };
}

async function askOpenAi(profile: ProfilePayload): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.COACH_MODEL ?? "gpt-4o-mini";
  const prompt = {
    role: "system" as const,
    content:
      "You are a calm typing coach for a Bible typing app called Scribe. You receive ONLY aggregate mistake statistics — never Scripture text. Reply with 2-4 short sentences of practical advice. No markdown, no lists, no scripture quotes. Warm, specific, encouraging.",
  };
  const user = {
    role: "user" as const,
    content: JSON.stringify(profile),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 220,
      messages: [prompt, user],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text && text.length > 20 ? text.slice(0, 800) : null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = sanitizeProfile(body);
  if (!payload) {
    return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  }

  const profile: TypingProfile = {
    ...emptyTypingProfile(),
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  const rules = buildRulesCoach(profile);
  const focus = rules.suggestedDrill?.focus ?? payload.topPairs[0]?.key ?? null;
  const suggestedDrill = focus
    ? {
        label: drillLabel(focus),
        href: drillHref(focus),
        focus,
      }
    : rules.suggestedDrill;

  try {
    const aiNarrative = await askOpenAi(payload);
    if (aiNarrative) {
      return NextResponse.json({
        narrative: aiNarrative,
        insights: rules.insights,
        suggestedDrill,
        source: "ai" as const,
      });
    }
  } catch {
    // fall through to rules
  }

  return NextResponse.json({
    narrative: rules.narrative,
    insights: rules.insights,
    suggestedDrill,
    source: "rules" as const,
  });
}
