"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/type", label: "Type" },
  { href: "/coach", label: "Coach" },
  { href: "/plans", label: "Plans" },
  { href: "/stats", label: "Stats" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header
      className={cn(
        "relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8 sm:py-5",
        !transparent && "border-b border-line/70",
      )}
    >
      <Link
        href="/"
        className="shrink-0 font-display text-xl tracking-tight text-ink sm:text-2xl"
      >
        Scribe
      </Link>

      <nav
        className="flex items-center gap-2.5 text-[12px] text-ink-muted sm:gap-6 sm:text-sm"
        aria-label="Primary"
      >
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                // App Router often no-ops same-path links, leaving sticky
                // ?go=1 lesson params in place. Force a clean URL for Type.
                if (link.href === "/type" && pathname === "/type") {
                  e.preventDefault();
                  router.replace("/type");
                  router.refresh();
                }
              }}
              className={cn(
                "transition hover:text-ink",
                active ? "text-ink" : undefined,
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/account"
          className="text-[12px] text-ink-muted transition hover:text-ink sm:text-sm"
        >
          Account
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
