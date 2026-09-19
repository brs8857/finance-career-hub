import { AlertTriangle, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/Card";
import {
  ACCOUNTANCY_COMPARISON,
  GENERAL_SOURCES,
  LAST_REVIEWED,
  PATHWAYS,
  type Pathway,
  type PathwayCategory,
} from "@/content/pathways";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Pathways" };

const CATEGORIES: PathwayCategory[] = ["Accountancy", "Banking & investment", "Economics & policy"];

function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
      {label}
      <ExternalLink aria-hidden className="size-3" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function PathwayDetail({ p }: { p: Pathway }) {
  return (
    <Card as="article" id={p.id} aria-labelledby={`${p.id}-title`} className="scroll-mt-20 space-y-4">
      <div>
        <h3 id={`${p.id}-title`} className="text-lg font-semibold">
          {p.name}
        </h3>
        <p className="text-sm text-muted">{p.summary}</p>
      </div>
      {p.changing ? (
        <p className="flex items-start gap-2 rounded-md bg-warn-bg px-3 py-2 text-xs text-warn-fg">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {p.changing}
        </p>
      ) : null}
      <div className="grid gap-5 text-sm md:grid-cols-2">
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">What the job involves</h4>
          <List items={p.whatItInvolves} />
        </section>
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Typical entry routes</h4>
          <List items={p.entryRoutes} />
        </section>
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Qualifications</h4>
          <List items={p.qualifications} />
        </section>
        <section className="rounded-md bg-surface-2 p-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">What to do at your stage</h4>
          <List items={p.atYourStage} />
        </section>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
        <span className="text-muted">Verify at source:</span>
        {p.sources.map((s) => (
          <SourceLink key={s.url} {...s} />
        ))}
      </p>
    </Card>
  );
}

export default function PathwaysPage() {
  return (
    <>
      <PageHeader
        title="Career pathways"
        description="Nine routes into finance, accounting and economics compared: what the work involves, how people get in, the qualifications, and what to do now."
      />

      <p className="mb-8 flex items-start gap-2 rounded-lg border border-border bg-warn-bg px-4 py-3 text-sm text-warn-fg">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          Details change every recruitment cycle - exam structures, entry requirements and deadlines included. Last reviewed{" "}
          {formatDate(LAST_REVIEWED)}. Always check the official links before you rely on anything here.
        </span>
      </p>

      <section aria-labelledby="compare-heading" className="mb-10">
        <h2 id="compare-heading" className="mb-3 text-lg font-semibold">
          At a glance
        </h2>
        <div className="relative overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Comparison of career pathways</caption>
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Route</th>
                <th scope="col" className="px-3 py-2 font-medium">Typical entry</th>
                <th scope="col" className="px-3 py-2 font-medium">Qualification</th>
                <th scope="col" className="px-3 py-2 font-medium">Good fit if…</th>
              </tr>
            </thead>
            <tbody>
              {PATHWAYS.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <th scope="row" className="px-3 py-2 font-medium">
                    <a href={`#${p.id}`} className="hover:text-accent hover:underline">
                      {p.name}
                    </a>
                    <span className="block text-xs font-normal text-muted">{p.category}</span>
                  </th>
                  <td className="px-3 py-2">{p.typicalEntry}</td>
                  <td className="px-3 py-2">{p.qualification}</td>
                  <td className="px-3 py-2 text-muted">{p.goodFitIf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="accountancy-heading" className="mb-10">
        <h2 id="accountancy-heading" className="mb-3 text-lg font-semibold">
          ACA vs ACCA vs CIMA
        </h2>
        <div className="relative overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Comparison of UK accountancy qualifications</caption>
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Qualification</th>
                <th scope="col" className="px-3 py-2 font-medium">Focus</th>
                <th scope="col" className="px-3 py-2 font-medium">Exams</th>
                <th scope="col" className="px-3 py-2 font-medium">Experience</th>
                <th scope="col" className="px-3 py-2 font-medium">Typical employers</th>
              </tr>
            </thead>
            <tbody>
              {ACCOUNTANCY_COMPARISON.map((row) => (
                <tr key={row.body} className="border-t border-border align-top">
                  <th scope="row" className="px-3 py-2 font-medium">
                    {row.body}
                  </th>
                  <td className="px-3 py-2">{row.focus}</td>
                  <td className="px-3 py-2">{row.exams}</td>
                  <td className="px-3 py-2">{row.experience}</td>
                  <td className="px-3 py-2 text-muted">{row.typical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Both ICAEW and ACCA have signalled changes to their qualifications - check the official pages.</p>
      </section>

      {CATEGORIES.map((category) => (
        <section key={category} aria-labelledby={`cat-${category}`} className="mb-10 space-y-4">
          <h2 id={`cat-${category}`} className="text-lg font-semibold">
            {category}
          </h2>
          {PATHWAYS.filter((p) => p.category === category).map((p) => (
            <PathwayDetail key={p.id} p={p} />
          ))}
        </section>
      ))}

      <Card>
        <h2 className="font-semibold">Whichever route you choose</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
          <li>
            Build commercial awareness a little every day with <Link href="/news" className="text-accent hover:underline">News &amp; notes</Link>{" "}
            - interviewers want your own view, not a summary.
          </li>
          <li>
            Keep the technical basics fresh with <Link href="/flashcards" className="text-accent hover:underline">flashcards</Link>.
          </li>
          <li>
            Track every application and deadline on the <Link href="/applications" className="text-accent hover:underline">board</Link>{" "}
            - many schemes recruit on a rolling basis, so earlier is better.
          </li>
          <li>Try free virtual work experience to test your interest and give yourself something concrete to talk about.</li>
        </ul>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {GENERAL_SOURCES.map((s) => (
            <SourceLink key={s.url} {...s} />
          ))}
        </p>
      </Card>
    </>
  );
}
