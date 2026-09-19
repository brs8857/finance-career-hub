// A single-lane queue: tasks run one at a time, at least `minGapMs` apart.
// Upstream APIs block bursts (Yahoo returned 404 for 11 rapid requests in
// testing), so every call to a rate-limited API goes through one of these.

export function createThrottle(minGapMs: number) {
  let tail: Promise<unknown> = Promise.resolve();
  let lastStart = 0;

  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(async () => {
      const wait = lastStart + minGapMs - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      lastStart = Date.now();
      return task();
    });
    // Keep the queue moving even if this task fails.
    tail = result.catch(() => undefined);
    return result;
  };
}
