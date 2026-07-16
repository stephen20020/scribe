"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadBible } from "@/lib/bible/load";
import { pickRandomVerse, randomVerseHref } from "@/lib/bible/random";
import {
  DEFAULT_VERSION,
  languageForVersion,
  type BibleLanguageId,
  type BibleVersionId,
} from "@/lib/bible/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { cn } from "@/lib/utils";

export function RandomVerseButton({
  className,
  label,
  version,
  language,
  replace = false,
}: {
  className?: string;
  label?: string;
  version?: BibleVersionId;
  /** UI language for the button label. Defaults to stored language preference. */
  language?: BibleLanguageId;
  replace?: boolean;
}) {
  const router = useRouter();
  const preferredVersion = useScribeStore((s) => s.preferences.version);
  const preferredLanguage = useScribeStore((s) => s.preferences.language);
  const [busy, setBusy] = useState(false);

  const uiLanguage = language ?? preferredLanguage ?? "en";
  const spanish = uiLanguage === "es";

  // Prefer an explicit version; otherwise use the preferred version only if it
  // matches the UI language (avoids loading Spanish text on an English page).
  const resolvedVersion: BibleVersionId = (() => {
    if (version) return version;
    if (languageForVersion(preferredVersion) === uiLanguage) {
      return preferredVersion;
    }
    return DEFAULT_VERSION[uiLanguage];
  })();

  const resolvedLabel =
    label ??
    (spanish ? "Escribir un versículo al azar" : "Type a random verse");

  async function goRandom() {
    if (busy) return;
    setBusy(true);
    try {
      const bible = await loadBible(resolvedVersion);
      const pick = pickRandomVerse(bible);
      const href = randomVerseHref(resolvedVersion, pick);
      if (replace) router.replace(href);
      else router.push(href);
    } catch {
      // keep user unblocked if load/navigation fails
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void goRandom();
      }}
      disabled={busy}
      aria-busy={busy}
      className={cn(className, busy && "opacity-60")}
    >
      {busy
        ? spanish
          ? "Buscando un versículo…"
          : "Finding a verse…"
        : resolvedLabel}
    </button>
  );
}
