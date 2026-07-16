"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadBible } from "@/lib/bible/load";
import { pickRandomVerse, randomVerseHref } from "@/lib/bible/random";
import type { BibleVersionId } from "@/lib/bible/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { cn } from "@/lib/utils";

export function RandomVerseButton({
  className,
  label = "Type a random verse",
  version,
  replace = false,
}: {
  className?: string;
  label?: string;
  version?: BibleVersionId;
  replace?: boolean;
}) {
  const router = useRouter();
  const preferred = useScribeStore((s) => s.preferences.version);
  const [busy, setBusy] = useState(false);

  async function goRandom() {
    if (busy) return;
    setBusy(true);
    try {
      const v = version ?? preferred;
      const bible = await loadBible(v);
      const pick = pickRandomVerse(bible);
      const href = randomVerseHref(v, pick);
      if (replace) router.replace(href);
      else router.push(href);
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={goRandom}
      disabled={busy}
      className={cn(className, busy && "opacity-60")}
    >
      {busy ? "Finding a verse…" : label}
    </button>
  );
}
