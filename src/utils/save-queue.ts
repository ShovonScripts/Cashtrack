export class SaveQueue {
  private queue: Promise<void> = Promise.resolve();

  async enqueue(saveFn: () => Promise<void>): Promise<boolean> {
    let success = false;
    this.queue = this.queue.then(async () => {
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
