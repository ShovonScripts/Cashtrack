/**
 * Runs asynchronous tasks one at a time, in submission order. A rejected task
 * only rejects its own caller; the queue keeps accepting work afterwards.
 */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(() => task());
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
