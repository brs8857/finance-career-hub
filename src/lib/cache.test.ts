import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCache } from "./cache";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "fch-cache-"));
});

afterEach(async () => {
  vi.useRealTimers();
  await rm(dir, { recursive: true, force: true });
});

describe("cached", () => {
  it("calls the loader once while the entry is fresh", async () => {
    const cache = createCache(dir);
    const loader = vi.fn(async () => 42);
    const a = await cache.cached("k", 60, loader);
    const b = await cache.cached("k", 60, loader);
    expect(a.value).toBe(42);
    expect(b.value).toBe(42);
    expect(b.stale).toBe(false);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("refetches after the TTL expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const cache = createCache(dir);
    const loader = vi.fn(async () => Date.now());
    await cache.cached("k", 60, loader);
    vi.advanceTimersByTime(61_000);
    await cache.cached("k", 60, loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("serves the old copy flagged stale when the loader fails", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const cache = createCache(dir);
    const first = await cache.cached("k", 60, async () => "good");
    vi.advanceTimersByTime(61_000);
    const result = await cache.cached("k", 60, async () => {
      throw new Error("upstream down");
    });
    expect(result).toEqual({ value: "good", storedAt: first.storedAt, stale: true });
  });

  it("throws when the loader fails and there is no copy at all", async () => {
    const cache = createCache(dir);
    await expect(
      cache.cached("k", 60, async () => {
        throw new Error("upstream down");
      }),
    ).rejects.toThrow("upstream down");
  });

  it("shares one loader call between concurrent requests", async () => {
    const cache = createCache(dir);
    let calls = 0;
    const loader = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return "v";
    };
    const results = await Promise.all([cache.cached("k", 60, loader), cache.cached("k", 60, loader)]);
    expect(calls).toBe(1);
    expect(results.map((r) => r.value)).toEqual(["v", "v"]);
  });

  it("persists to disk, so a new cache instance (e.g. after restart) reuses it", async () => {
    await createCache(dir).cached("k", 60, async () => "from disk");
    const loader = vi.fn(async () => "refetched");
    const result = await createCache(dir).cached("k", 60, loader);
    expect(result.value).toBe("from disk");
    expect(loader).not.toHaveBeenCalled();
  });
});
