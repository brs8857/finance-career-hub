"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/news", label: "Today's headlines" },
  { href: "/news/notes", label: "My notes archive" },
];

export function NewsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="News sections" className="mb-6 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
