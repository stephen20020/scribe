"use client";

import { useState } from "react";
import Link from "next/link";
import { buildRulesCoach } from "@/lib/coach/rules";
import { formatPairKey } from "@/lib/coach/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { syncTypingProfile } from "@/lib/supabase/persist";

export function CoachCard() {
  const profile = useScribeStore((s) => s.typingProfile);
  const setCoach = useScribeStore((s) => s.setTypingProfileCoach);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rules = buildRulesCoach(profile);
  const narrative = profile.narrative ?? rules.narrative;
  const source = profile.narrativeSource ?? rules.source;
  const drill = profile.suggestedDrill ?? rules.suggestedDrill;
  const insights = rules.insights;

  async function refreshAi() {
    if (profile.sessionsSampled < 1 || profile.totalMistakes < 3) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            sessionsSampled: profile.sessionsSampled,
            topPairs: profile.topPairs.slice(0, 8),
            topBigrams: profile.topBigrams.slice(0, 6),
            weakChars: profile.weakChars.slice(0, 8),
            earlyErrors: profile.earlyErrors,
            lateErrors: profile.lateErrors,
            punctuationErrors: profile.punctuationErrors,
            totalMistakes: profile.totalMistakes,
          },
        }),
      });
      const data = (await res.json()) as {
        narrative?: string;
        suggestedDrill?: typeof drill;
        source?: "rules" | "ai";
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Coach unavailable");
        return;
      }
      if (data.narrative) {
        setCoach({
          narrative: data.narrative,
          narrativeSource: data.source === "ai" ? "ai" : "rules",
          suggestedDrill: data.suggestedDrill ?? rules.suggestedDrill,
        });
        void syncTypingProfile();
      }
    } catch {
      setError("Could not reach coach");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-14 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Typing coach</h2>
        <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
          {source === "ai" ? "Claude + patterns" : "Pattern tips"}
          {busy ? " · updating" : ""}
        </span>
      </div>

      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
        {narrative}
      </p>

      {insights.length > 0 && (
        <ul className="mt-6 space-y-4">
          {insights.map((insight) => (
            <li key={insight.id} className="border-b border-line/60 pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg tracking-tight">
                  {insight.headline}
                </h3>
                <span className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                  {insight.severity}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{insight.detail}</p>
              {insight.evidence[0] && (
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  {insight.evidence[0]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {profile.topPairs.length > 0 && (
        <p className="mt-5 font-mono text-[11px] text-ink-faint">
          Top misses:{" "}
          {profile.topPairs.slice(0, 4).map((p, i) => (
            <span key={p.key}>
              {i > 0 ? " · " : ""}
              {formatPairKey(p.key)}×{p.count}
            </span>
          ))}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-ink-muted">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {drill && (
          <Link
            href={drill.href}
            className="rounded-full bg-ink px-6 py-3 text-sm text-bg"
          >
            {drill.label}
          </Link>
        )}
        <button
          type="button"
          onClick={() => void refreshAi()}
          disabled={busy || profile.totalMistakes < 3}
          className="rounded-full border border-line px-6 py-3 text-sm text-ink-muted hover:text-ink disabled:opacity-40"
        >
          Refresh coach
        </button>
      </div>
    </section>
  );
}
