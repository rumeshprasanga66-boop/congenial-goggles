import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A small atomic JSON store used by the file-backed repositories.
 *
 * Writes go to a temporary file and are then renamed into place, so a crash
 * mid-write cannot leave a partially written file. All access is serialised
 * through a promise queue: without that, two concurrent read-modify-write calls
 * would read the same starting state and the second would overwrite the first.
 *
 * This is the storage primitive, not a domain module. Repositories own their
 * record shape and pass it through unchanged.
 */

export const DATA_DIR =
  process.env.NW_DATA_DIR?.trim() || path.join(process.cwd(), ".data");

export interface JsonStore<T> {
  /** A copy of the current collection. */
  read(): Promise<T[]>;
  /** Replace the whole collection. Callers pass the full next state. */
  write(items: T[]): Promise<void>;
  /**
   * Read-modify-write as a single queued operation. The change function returns
   * the next collection and any result the caller needs.
   */
  update<R>(change: (items: T[]) => { items: T[]; result: R }): Promise<R>;
}

export function createJsonStore<T>(fileName: string): JsonStore<T> {
  const filePath = path.join(DATA_DIR, fileName);
  let queue: Promise<unknown> = Promise.resolve();
  let cache: T[] | null = null;

  function enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = queue.then(task, task);
    // Keep the chain alive even when a task rejects.
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function load(): Promise<T[]> {
    if (cache) return cache;
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as { items?: unknown };
      cache = Array.isArray(parsed.items) ? (parsed.items as T[]) : [];
    } catch (error) {
      // A missing file is the normal first-run case, not a failure.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`Could not read ${fileName}:`, error);
      }
      cache = [];
    }
    return cache;
  }

  async function persist(items: T[]): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    const temporary = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify({ version: 1, items }, null, 2), "utf8");
    await rename(temporary, filePath);
    cache = items;
  }

  return {
    async read() {
      return [...(await load())];
    },
    write(items) {
      return enqueue(() => persist(items));
    },
    update(change) {
      return enqueue(async () => {
        const { items, result } = change([...(await load())]);
        await persist(items);
        return result;
      });
    },
  };
}
