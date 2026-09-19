"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function apply(theme: Theme) {
  const dark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readSaved(): Theme {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

// The saved choice lives in localStorage. Components subscribe to it so every
// toggle on the page (sidebar + mobile menu) stays in sync.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ThemeToggle() {
  // On the server (and during hydration) this reads "system"; afterwards the real choice.
  const theme = useSyncExternalStore(subscribe, readSaved, () => "system" as Theme);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing: the choice just won't persist.
    }
    apply(next);
    listeners.forEach((listener) => listener());
  }

  return (
    <fieldset className="rounded-md border border-border p-1">
      <legend className="sr-only">Colour theme</legend>
      <div className="grid grid-cols-3 gap-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            aria-pressed={theme === value}
            title={`${label} theme`}
            className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs ${
              theme === value ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
            }`}
          >
            <Icon aria-hidden className="size-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
