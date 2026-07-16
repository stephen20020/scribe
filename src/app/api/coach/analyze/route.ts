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

const SYSTEM =
  "You are a calm typing coach for a Bible typing app called Scribe. You receive ONLY aggregate mistake statistics — never Scripture text. Reply with 2-4 short sentences of practical advice. No markdown, no lists, no scripture quotes. Warm, specific, encouraging.";

type ClaudeResult =
  | { ok: true; text: string }
  | { ok: false; reason: string | null };

async function askClaude(profile: ProfilePayload): Promise<ClaudeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: "ANTHROPIC_API_KEY is not set" };

  const model = process.env.COACH_MODEL ?? "claude-haiku-4-5-20251001";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 220,
      temperature: 0.4,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Here are this typist's aggregate mistake stats (JSON). Write the coaching note:\n${JSON.stringify(profile)}`,
        },
      ],
    }),
  });

  const data = (await res.json()) as {
    content?: { type?: string; text?: string }[];
    error?: { message?: string; type?: string };
  };

  if (!res.ok) {
    const msg = data.error?.message ?? `Claude request failed (${res.status})`;
    if (/credit balance|billing|purchase credits/i.test(msg)) {
      return {
        ok: false,
        reason:
          "Claude API has no credits — add billing at platform.claude.com/settings/billing",
      };
    }
    return { ok: false, reason: msg };
  }

  const text = data.content
    ?.filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text || text.length <= 20) {
    return { ok: false, reason: "Claude returned an empty coach note" };
  }
  return { ok: true, text: text.slice(0, 800) };
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
    const ai = await askClaude(payload);
    if (ai.ok) {
      return NextResponse.json({
        narrative: ai.text,
        insights: rules.insights,
        suggestedDrill,
        source: "ai" as const,
      });
    }
    return NextResponse.json({
      narrative: rules.narrative,
      insights: rules.insights,
      suggestedDrill,
      source: "rules" as const,
      aiError: ai.reason,
    });
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
