"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/type", label: "Type" },
  { href: "/plans", label: "Plans" },
  { href: "/stats", label: "Stats" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "relative z-20 flex items-center justify-between gap-4 px-5 py-5 sm:px-8",
        !transparent && "border-b border-line/70",
      )}
    >
      <Link href="/" className="font-display text-2xl tracking-tight text-ink">
        Scribe
      </Link>

      <nav className="flex items-center gap-3 text-sm text-ink-muted sm:gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "transition hover:text-ink",
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? "text-ink"
                : "max-sm:sr-only",
              link.href === "/type" && "max-sm:not-sr-only",
              link.href === "/plans" && "max-sm:not-sr-only",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="text-sm text-ink-muted transition hover:text-ink"
        >
          Account
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
