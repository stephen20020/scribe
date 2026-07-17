import { NextResponse } from "next/server";
import {
  buildPracticeDeal,
  flattenDealText,
  getDealPhase,
} from "@/lib/coach/drill";
import { getAuthedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SYSTEM = `You write custom typing practice passages for Scribe, a calm Bible typing app.
Rules:
- Output ONLY the practice text the user will type. No title, no markdown, no quotes around the whole thing.
- Use plain English. Calm tone. No Scripture quotations or verse references.
- Densely include the target letter(s) / digraph / punctuation the user struggles with.
- 3 short paragraphs separated by a blank line, matching phases: isolate words → short phrases → longer lines.
- About 280–450 characters total. ASCII punctuation only.`;

async function askClaudePassage(opts: {
  focus: string;
  title: string;
  why: string;
  phase?: string | null;
}): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.COACH_MODEL ?? "claude-haiku-4-5-20251001";

  const phaseHint = opts.phase
    ? `Write only the ${opts.phase} phase (~120–180 chars).`
    : "Write all three phases as three short paragraphs.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.5,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${phaseHint}\nFocus key: ${opts.focus}\nDeal: ${opts.title}\nWhy: ${opts.why}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    content?: { type?: string; text?: string }[];
  };
  const text = data.content
    ?.filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text || text.length < 40) return null;
  // Strip accidental wrapping quotes / labels
  return text
    .replace(/^["']|["']$/g, "")
    .replace(/^(Isolate|Context|Transfer|Pace|Sustain|Finish)\s*:\s*/gim, "")
    .slice(0, 1200);
}

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in required for the typing coach" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const focus =
    typeof (body as { focus?: unknown }).focus === "string"
      ? String((body as { focus: string }).focus).slice(0, 32)
      : "";
  const phaseRaw = (body as { phase?: unknown }).phase;
  const phase =
    typeof phaseRaw === "string" &&
    ["isolate", "context", "transfer"].includes(phaseRaw)
      ? phaseRaw
      : null;
  const wantAi = (body as { ai?: unknown }).ai !== false;

  if (!focus) {
    return NextResponse.json({ error: "Missing focus" }, { status: 400 });
  }

  const deal = buildPracticeDeal({ focus });
  const fallbackPhase = getDealPhase(deal, phase);
  const fallbackText = phase
    ? fallbackPhase.text
    : flattenDealText(deal);

  let text = fallbackText;
  let source: "rules" | "ai" = "rules";

  if (wantAi) {
    try {
      const aiText = await askClaudePassage({
        focus,
        title: deal.title,
        why: deal.why,
        phase,
      });
      if (aiText) {
        text = aiText;
        source = "ai";
      }
    } catch {
      // keep rules text
    }
  }

  return NextResponse.json({
    deal: {
      id: deal.id,
      focus: deal.focus,
      title: deal.title,
      why: deal.why,
      severity: deal.severity,
      evidence: deal.evidence,
      phases: deal.phases.map((p) => ({
        id: p.id,
        label: p.label,
        cue: p.cue,
      })),
    },
    phase: phase ?? "all",
    text,
    source,
    label: `${deal.title}${phase ? ` · ${fallbackPhase.label}` : ""}`,
  });
}
