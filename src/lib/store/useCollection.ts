"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { IS_DEMO } from "@/lib/demo";
import type { CollectionName, CollectionValue } from "./collections";

// Client-side access to a saved collection.
//
//   const { data, status, update } = useCollection("watchlist");
//   update((list) => [...list, newItem]);
//
// All components using the same collection share one copy, so they stay in
// sync. Updates show instantly and are saved to data/<name>.json in the
// background, in order. If a save fails, `saveError` explains why.

type Status = "loading" | "ready" | "error";

interface Snapshot<T> {
  data: T | undefined;
  status: Status;
  error: string | null;
  saveError: string | null;
}

const LOADING: Snapshot<never> = { data: undefined, status: "loading", error: null, saveError: null };

const snapshots = new Map<CollectionName, Snapshot<unknown>>();
const listeners = new Map<CollectionName, Set<() => void>>();
const loads = new Map<CollectionName, Promise<void>>();
const saveQueues = new Map<CollectionName, Promise<void>>();

function emit(name: CollectionName, next: Snapshot<unknown>) {
  snapshots.set(name, next);
  listeners.get(name)?.forEach((listener) => listener());
}

async function errorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `HTTP ${res.status}`;
}

function load(name: CollectionName, force = false): Promise<void> {
  if (!force && loads.has(name)) return loads.get(name)!;
  const promise = (async () => {
    try {
      const res = await fetch(`/api/store/${name}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await errorMessage(res));
      const body = (await res.json()) as { value: unknown };
      emit(name, { data: body.value, status: "ready", error: null, saveError: null });
    } catch (error) {
      loads.delete(name); // allow a retry
      emit(name, { ...LOADING, status: "error", error: (error as Error).message });
    }
  })();
  loads.set(name, promise);
  return promise;
}

function save(name: CollectionName, value: unknown) {
  // Demo deployment: keep changes in this tab only, never send them to the server.
  if (IS_DEMO) return;
  const previous = saveQueues.get(name) ?? Promise.resolve();
  const job = previous.then(async () => {
    try {
      const res = await fetch(`/api/store/${name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      const current = snapshots.get(name);
      if (current?.saveError) emit(name, { ...current, saveError: null });
    } catch (error) {
      const current = snapshots.get(name) ?? LOADING;
      emit(name, { ...current, saveError: `Couldn't save: ${(error as Error).message}` });
    }
  });
  saveQueues.set(name, job);
}

export function useCollection<N extends CollectionName>(name: N) {
  type T = CollectionValue<N>;

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(listener);
      return () => listeners.get(name)?.delete(listener);
    },
    [name],
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    () => (snapshots.get(name) ?? LOADING) as Snapshot<T>,
    () => LOADING as Snapshot<T>,
  );

  useEffect(() => {
    void load(name);
  }, [name]);

  /** Apply a change: shows immediately, saves in the background. */
  const update = useCallback(
    (updater: (current: T) => T) => {
      const current = snapshots.get(name) as Snapshot<T> | undefined;
      if (!current || current.status !== "ready" || current.data === undefined) return;
      const next = updater(current.data);
      emit(name, { ...current, data: next });
      save(name, next);
    },
    [name],
  );

  const reload = useCallback(() => load(name, true), [name]);

  return { ...snapshot, update, reload };
}
