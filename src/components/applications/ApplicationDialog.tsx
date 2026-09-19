"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { moveToStage, ROUTES, STAGES, type RouteId, type StageId } from "@/lib/applications/model";
import { newId, type Application, type Contact } from "@/lib/store/collections";

type Draft = Omit<Application, "id" | "history" | "createdAt" | "updatedAt">;

const EMPTY: Draft = {
  employer: "",
  role: "",
  route: "spring-week",
  stage: "researching",
  deadline: null,
  rolling: false,
  link: "",
  notes: "",
  contacts: [],
};

const inputClass = "mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm";

/**
 * Create or edit an application. `open` is either "new" (optionally with a
 * starting stage), an existing application, or null when closed.
 */
export function ApplicationDialog({
  open,
  onSave,
  onDelete,
  onClose,
}: {
  open: { mode: "new"; stage?: StageId } | { mode: "edit"; app: Application } | null;
  onSave: (app: Application) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the dialog opens for something different.
  const openKey = open ? (open.mode === "edit" ? open.app.id : `new-${open.stage ?? ""}`) : null;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (openKey !== loadedFor) {
    setLoadedFor(openKey);
    setError(null);
    if (open?.mode === "edit") {
      const a = open.app;
      setDraft({
        employer: a.employer,
        role: a.role,
        route: a.route,
        stage: a.stage,
        deadline: a.deadline,
        rolling: a.rolling,
        link: a.link,
        notes: a.notes,
        contacts: a.contacts,
      });
    } else {
      setDraft({ ...EMPTY, stage: open?.stage ?? "researching" });
    }
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function setContact(id: string, patch: Partial<Contact>) {
    setDraft((d) => ({ ...d, contacts: d.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!open) return;
    const employer = draft.employer.trim();
    if (!employer) return setError("Add the employer's name.");
    const link = draft.link.trim();
    if (link && !/^https?:\/\//i.test(link)) return setError("The link needs to start with https://");
    const contacts = draft.contacts
      .map((c) => ({ ...c, name: c.name.trim(), role: c.role.trim(), email: c.email.trim(), notes: c.notes.trim() }))
      .filter((c) => c.name);
    const now = new Date();
    const clean = { ...draft, employer, role: draft.role.trim(), link, notes: draft.notes.trim(), contacts };

    if (open.mode === "edit") {
      const moved = moveToStage(open.app, clean.stage, now);
      onSave({ ...moved, ...clean, updatedAt: now.toISOString() });
    } else {
      onSave({
        ...clean,
        id: newId(),
        history: [{ stage: clean.stage, at: now.toISOString() }],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
    ref.current?.close();
  }

  function remove() {
    if (open?.mode !== "edit") return;
    if (!window.confirm(`Delete your application to ${open.app.employer}? This can't be undone.`)) return;
    onDelete(open.app.id);
    ref.current?.close();
  }

  const titleId = `${uid}-title`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-xl border border-border bg-surface p-0 text-fg shadow-xl"
    >
      {open ? (
        <form onSubmit={submit} noValidate className="space-y-4 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {open.mode === "edit" ? `Edit: ${open.app.employer}` : "Add an application"}
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Close without saving"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-employer`} className="text-sm font-medium">
                Employer <span className="text-down">*</span>
              </label>
              <input id={`${uid}-employer`} required value={draft.employer} onChange={(e) => set("employer", e.target.value)} className={inputClass} maxLength={120} />
            </div>
            <div>
              <label htmlFor={`${uid}-role`} className="text-sm font-medium">
                Role
              </label>
              <input id={`${uid}-role`} value={draft.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Audit & Assurance" className={`${inputClass} placeholder:text-muted`} maxLength={160} />
            </div>
            <div>
              <label htmlFor={`${uid}-route`} className="text-sm font-medium">
                Route
              </label>
              <select id={`${uid}-route`} value={draft.route} onChange={(e) => set("route", e.target.value as RouteId)} className={inputClass}>
                {ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-stage`} className="text-sm font-medium">
                Stage
              </label>
              <select id={`${uid}-stage`} value={draft.stage} onChange={(e) => set("stage", e.target.value as StageId)} className={inputClass}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-deadline`} className="text-sm font-medium">
                Deadline
              </label>
              <input
                id={`${uid}-deadline`}
                type="date"
                value={draft.deadline ?? ""}
                onChange={(e) => set("deadline", e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" checked={draft.rolling} onChange={(e) => set("rolling", e.target.checked)} className="size-4" />
                Rolling recruitment (may close early)
              </label>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-link`} className="text-sm font-medium">
                Link
              </label>
              <input
                id={`${uid}-link`}
                type="url"
                inputMode="url"
                value={draft.link}
                onChange={(e) => set("link", e.target.value)}
                placeholder="https://…"
                className={`${inputClass} placeholder:text-muted`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-notes`} className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id={`${uid}-notes`}
                rows={4}
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Why this firm? Values, recent news, what the role involves, questions to ask…"
                className={`${inputClass} placeholder:text-muted`}
                maxLength={8000}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Contacts</legend>
            {draft.contacts.length === 0 ? (
              <p className="text-xs text-muted">People you&apos;ve met at events, on LinkedIn or through the firm.</p>
            ) : null}
            {draft.contacts.map((c, i) => (
              <div key={c.id} className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input aria-label={`Contact ${i + 1} name`} placeholder="Name" value={c.name} onChange={(e) => setContact(c.id, { name: e.target.value })} className={`${inputClass} mt-0 placeholder:text-muted`} />
                <input aria-label={`Contact ${i + 1} role`} placeholder="Role" value={c.role} onChange={(e) => setContact(c.id, { role: e.target.value })} className={`${inputClass} mt-0 placeholder:text-muted`} />
                <input aria-label={`Contact ${i + 1} email`} placeholder="Email (optional)" type="email" value={c.email} onChange={(e) => setContact(c.id, { email: e.target.value })} className={`${inputClass} mt-0 placeholder:text-muted`} />
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, contacts: d.contacts.filter((x) => x.id !== c.id) }))}
                  className="justify-self-end rounded p-2 text-muted hover:bg-surface-2 hover:text-down"
                  aria-label={`Remove contact ${c.name || i + 1}`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
                <input aria-label={`Contact ${i + 1} notes`} placeholder="Notes, e.g. met at spring insight evening" value={c.notes} onChange={(e) => setContact(c.id, { notes: e.target.value })} className={`${inputClass} mt-0 placeholder:text-muted sm:col-span-4`} />
              </div>
            ))}
            <Button
              size="sm"
              onClick={() => setDraft((d) => ({ ...d, contacts: [...d.contacts, { id: newId(), name: "", role: "", email: "", notes: "" }] }))}
            >
              <Plus aria-hidden className="size-3.5" /> Add contact
            </Button>
          </fieldset>

          {error ? (
            <p role="alert" className="text-sm text-down">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            {open.mode === "edit" ? (
              <Button variant="danger" onClick={remove}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button onClick={() => ref.current?.close()}>Cancel</Button>
              <Button type="submit" variant="primary">
                {open.mode === "edit" ? "Save changes" : "Add application"}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
