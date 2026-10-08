export class ResetRegistry {
  private handlers: (() => Promise<void>)[] = [];

  register(handler: () => Promise<void>): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  async runAll(): Promise<void> {
    for (const handler of this.handlers) {
      await handler();
    }
  }
}
