import { FlaskConical } from "lucide-react";
import { DEMO_NOTICE, IS_DEMO } from "@/lib/demo";

const REPO = "https://github.com/brs8857/market-tracker";

/** Shown on every page of a public demo deployment. Renders nothing locally. */
export function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="border-b border-border bg-warn-bg px-4 py-2 text-xs text-warn-fg md:px-8">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1">
        <FlaskConical aria-hidden className="size-3.5 shrink-0" />
        <strong className="font-semibold">{DEMO_NOTICE}</strong>
        <span>
          Market and economic data are real. Add a ticker or write a note to try it - it will disappear when you reload.
        </span>
        <a href={REPO} target="_blank" rel="noopener noreferrer" className="underline">
          Run your own copy
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
}
