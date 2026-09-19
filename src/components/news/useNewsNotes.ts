"use client";

import { useCallback, useMemo } from "react";
import type { NewsNote } from "@/lib/store/collections";
import { useCollection } from "@/lib/store/useCollection";

/** News notes keyed by article URL, with save/delete helpers. */
export function useNewsNotes() {
  const collection = useCollection("newsNotes");
  const { update } = collection;

  const byUrl = useMemo(() => new Map((collection.data ?? []).map((n) => [n.url, n])), [collection.data]);

  const save = useCallback(
    (note: NewsNote) => update((all) => [...all.filter((n) => n.id !== note.id && n.url !== note.url), note]),
    [update],
  );
  const remove = useCallback((id: string) => update((all) => all.filter((n) => n.id !== id)), [update]);

  return { ...collection, notes: collection.data ?? [], byUrl, save, remove };
}
