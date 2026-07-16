/** Imperative DOM helpers for the typing hot path — no React re-renders. */

export type CharStatus = "pending" | "correct" | "incorrect" | "current";

export function charClassName(status: CharStatus, isSpace: boolean): string {
  const parts = ["typing-char"];
  if (isSpace) parts.push("typing-char-space");
  if (status === "correct") parts.push("text-correct");
  if (status === "incorrect") {
    parts.push("text-incorrect", "underline", "decoration-incorrect/40");
  }
  if (status === "pending") parts.push("text-ink-faint");
  if (status === "current") parts.push("typing-char-current", "text-ink");
  return parts.join(" ");
}

export function paintChar(
  el: HTMLElement | null | undefined,
  status: CharStatus,
  isSpace: boolean,
) {
  if (!el) return;
  el.className = charClassName(status, isSpace);
}

/** Keep caret in the focus band. Instant scroll while bursting keys. */
export function scrollCaretIntoBand(
  scroller: HTMLElement,
  caret: HTMLElement,
  opts: { smooth: boolean },
) {
  const scrollerRect = scroller.getBoundingClientRect();
  const caretRect = caret.getBoundingClientRect();
  if (scrollerRect.height < 40) return;

  const bandTop = scrollerRect.top + scrollerRect.height * 0.28;
  const bandBottom = scrollerRect.top + scrollerRect.height * 0.45;
  const ideal = scrollerRect.top + scrollerRect.height * 0.36;
  const outside = caretRect.top < bandTop || caretRect.bottom > bandBottom;
  if (!outside) return;

  const delta = caretRect.top - ideal;
  if (Math.abs(delta) < 6) return;

  scroller.scrollBy({
    top: delta,
    behavior: opts.smooth ? "smooth" : "auto",
  });
}
