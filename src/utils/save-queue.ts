const activeQueues = new Set<SaveQueue>();
let lockDepth = 0;
let lockGeneration = 0;

/**
 * - `saved`: the write reached storage.
 * - `skipped`: a restore/queue lock intentionally discarded the stale write.
 * - `failed`: storage rejected the write.
 */
export type SaveOutcome = 'saved' | 'skipped' | 'failed';

export class SaveQueue {
  private queue: Promise<void> = Promise.resolve();

  constructor() {
    activeQueues.add(this);
  }

  /**
   * Runs a save and reports why it did or did not reach storage, so callers can
   * distinguish an intentional skip (during a restore) from a real failure.
   */
  async enqueueDetailed(saveFn: () => Promise<void>): Promise<SaveOutcome> {
    let outcome: SaveOutcome = 'skipped';
    const generation = lockGeneration;
    this.queue = this.queue.then(async () => {
      if (lockDepth > 0 || generation !== lockGeneration) {
        outcome = 'skipped';
        return;
      }
      try {
        await saveFn();
        outcome = 'saved';
      } catch (err) {
        console.error('[cashtrack] Save queue error', err);
        outcome = 'failed';
      }
    });
    await this.queue;
    return outcome;
  }

  async enqueue(saveFn: () => Promise<void>): Promise<boolean> {
    return (await this.enqueueDetailed(saveFn)) === 'saved';
  }

  async whenIdle(): Promise<void> {
    await this.queue;
  }
}

export async function runWithSaveQueueLock<T>(run: () => Promise<T>): Promise<T> {
  lockDepth += 1;
  lockGeneration += 1;
  try {
    await Promise.all([...activeQueues].map((queue) => queue.whenIdle()));
    return await run();
  } finally {
    lockDepth -= 1;
  }
}

export function shouldSave({
  hasLoaded,
  loadFailed,
  currentJson,
  lastSavedJson,
}: {
  hasLoaded: boolean;
  loadFailed: boolean;
  currentJson: string;
  lastSavedJson: string;
}): boolean {
  if (!hasLoaded || loadFailed) return false;
  if (currentJson === lastSavedJson) return false;
  return true;
}
