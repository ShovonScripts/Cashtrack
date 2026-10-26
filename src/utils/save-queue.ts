const activeQueues = new Set<SaveQueue>();
let lockDepth = 0;
let lockGeneration = 0;

export class SaveQueue {
  private queue: Promise<void> = Promise.resolve();

  constructor() {
    activeQueues.add(this);
  }

  async enqueue(saveFn: () => Promise<void>): Promise<boolean> {
    let success = false;
    const generation = lockGeneration;
    this.queue = this.queue.then(async () => {
      if (lockDepth > 0 || generation !== lockGeneration) {
        return;
      }
      try {
        await saveFn();
        success = true;
      } catch (err) {
        console.error('[cashtrack] Save queue error', err);
        success = false;
      }
    });
    await this.queue;
    return success;
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
