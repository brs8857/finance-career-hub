import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// A small TTL cache for upstream API responses.
//
// Lookup order: memory -> .cache/<key>.json -> loader (the real API call).
// The file layer means restarting `npm run dev` doesn't refetch everything.
// If the loader fails but an expired copy exists, that copy is returned with
// `stale: true`, so the UI can say "showing last known data" instead of
// breaking.

export interface CacheEntry<T> {
  value: T;
  /** Epoch ms when the value was fetched from upstream. */
  storedAt: number;
  /** Epoch ms after which it should be refetched. */
  expiresAt: number;
}

export interface CachedResult<T> {
  value: T;
  storedAt: number;
  stale: boolean;
}

export function createCache(dir: string) {
  const memory = new Map<string, CacheEntry<unknown>>();
  const inflight = new Map<string, Promise<CachedResult<unknown>>>();

  function fileFor(key: string): string {
    const safe = key.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const hash = createHash("sha1").update(key).digest("hex").slice(0, 10);
    return path.join(dir, `${safe}-${hash}.json`);
  }

  async function read<T>(key: string): Promise<CacheEntry<T> | null> {
    const hit = memory.get(key) as CacheEntry<T> | undefined;
    if (hit) return hit;
    try {
      const entry = JSON.parse(await readFile(fileFor(key), "utf8")) as CacheEntry<T>;
      memory.set(key, entry);
      return entry;
    } catch {
      return null; // missing or unreadable file = cache miss
    }
  }

  async function write<T>(key: string, value: T, ttlSeconds: number): Promise<CacheEntry<T>> {
    const now = Date.now();
    const entry: CacheEntry<T> = { value, storedAt: now, expiresAt: now + ttlSeconds * 1000 };
    memory.set(key, entry);
    try {
      await mkdir(dir, { recursive: true });
      const file = fileFor(key);
      const tmp = `${file}.${process.pid}.${now}.tmp`;
      await writeFile(tmp, JSON.stringify(entry));
      await rename(tmp, file);
    } catch {
      // Disk cache is an optimisation; memory still has it.
    }
    return entry;
  }

  /**
   * Return a fresh cached value, or run `loader` and cache its result.
   * Concurrent calls for the same key share one loader call.
   * Throws only if the loader fails AND there is no earlier copy at all.
   */
  async function cached<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<CachedResult<T>> {
    const existing = await read<T>(key);
    if (existing && existing.expiresAt > Date.now()) {
      return { value: existing.value, storedAt: existing.storedAt, stale: false };
    }

    const pending = inflight.get(key) as Promise<CachedResult<T>> | undefined;
    if (pending) return pending;

    const run = (async (): Promise<CachedResult<T>> => {
      try {
        const value = await loader();
        const entry = await write(key, value, ttlSeconds);
        return { value, storedAt: entry.storedAt, stale: false };
      } catch (error) {
        if (existing) return { value: existing.value, storedAt: existing.storedAt, stale: true };
        throw error;
      } finally {
        inflight.delete(key);
      }
    })();

    inflight.set(key, run);
    return run;
  }

  return { cached, read, write };
}

const defaultCache = createCache(path.join(process.cwd(), ".cache"));

export const cached = defaultCache.cached;
export const readCache = defaultCache.read;
export const writeCache = defaultCache.write;
