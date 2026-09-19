import { BookOpen } from "lucide-react";
import type { Explainer as ExplainerContent } from "@/lib/macro/explainers";

/** Collapsible "what it is / why markets care / syllabus" panel. */
export function Explainer({ content }: { content: ExplainerContent }) {
  return (
    <details className="group rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm">
      <summary className="flex cursor-pointer items-center gap-2 font-medium">
        <BookOpen aria-hidden className="size-4 text-accent" />
        What it is, why markets care, syllabus links
      </summary>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">What it is</h4>
          <p className="mb-2">
            <strong className="font-medium">UK:</strong> {content.what.UK}
          </p>
          <p>
            <strong className="font-medium">US:</strong> {content.what.US}
          </p>
        </section>
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Why markets care</h4>
          <ul className="list-disc space-y-1 pl-4">
            {content.whyMarketsCare.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Links to your syllabus</h4>
          <ul className="list-disc space-y-1 pl-4">
            {content.syllabus.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </details>
  );
}
