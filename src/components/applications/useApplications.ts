"use client";

import { useCallback } from "react";
import { moveToStage, type StageId } from "@/lib/applications/model";
import type { Application } from "@/lib/store/collections";
import { useCollection } from "@/lib/store/useCollection";

export function useApplications() {
  const collection = useCollection("applications");
  const { update } = collection;

  const save = useCallback(
    (app: Application) => update((all) => (all.some((a) => a.id === app.id) ? all.map((a) => (a.id === app.id ? app : a)) : [...all, app])),
    [update],
  );
  const remove = useCallback((id: string) => update((all) => all.filter((a) => a.id !== id)), [update]);
  const move = useCallback(
    (id: string, stage: StageId) =>
      update((all) =>
        all.map((a) => (a.id === id ? { ...moveToStage(a, stage), updatedAt: new Date().toISOString() } : a)),
      ),
    [update],
  );

  return { ...collection, apps: collection.data ?? [], save, remove, move };
}
