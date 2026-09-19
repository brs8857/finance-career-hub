import { describe, expect, it } from "vitest";
import { createThrottle } from "./throttle";

describe("createThrottle", () => {
  it("runs tasks one at a time, in order, spaced apart", async () => {
    const run = createThrottle(30);
    const starts: number[] = [];
    const order: number[] = [];
    await Promise.all(
      [1, 2, 3].map((n) =>
        run(async () => {
          starts.push(Date.now());
          order.push(n);
        }),
      ),
    );
    expect(order).toEqual([1, 2, 3]);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(25);
    expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(25);
  });

  it("keeps going after a task fails", async () => {
    const run = createThrottle(0);
    await expect(run(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(run(async () => "ok")).resolves.toBe("ok");
  });
});
