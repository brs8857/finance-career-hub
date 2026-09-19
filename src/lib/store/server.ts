import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { collections, type CollectionName, type CollectionValue } from "./collections";

// Reads and writes collections as JSON files in data/.
// Writes are atomic (write a temp file, then rename over the real one) and
// serialised per collection, so a crash mid-write can't corrupt your notes.

const DATA_DIR = path.join(process.cwd(), "data");
const locks = new Map<CollectionName, Promise<unknown>>();

function fileFor(name: CollectionName): string {
  return path.join(DATA_DIR, `${name}.json`);
}

export class ValidationError extends Error {}

export async function readCollection<N extends CollectionName>(name: N): Promise<CollectionValue<N>> {
  const def = collections[name];
  let text: string;
  try {
    text = await readFile(fileFor(name), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return def.initial() as CollectionValue<N>;
    throw error;
  }
  const parsed = def.schema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    // Don't silently discard a file the user may have hand-edited.
    throw new Error(`data/${name}.json doesn't match the expected shape: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data as CollectionValue<N>;
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  // Windows can briefly lock files (antivirus, editors). Retry a few times.
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 4 || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}

export async function writeCollection<N extends CollectionName>(
  name: N,
  value: unknown,
): Promise<CollectionValue<N>> {
  const parsed = collections[name].schema.safeParse(value);
  if (!parsed.success) throw new ValidationError(z.prettifyError(parsed.error));

  const previous = locks.get(name) ?? Promise.resolve();
  const job = previous.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const file = fileFor(name);
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");
    await renameWithRetry(tmp, file);
  });
  locks.set(
    name,
    job.catch(() => undefined),
  );
  await job;
  return parsed.data as CollectionValue<N>;
}
