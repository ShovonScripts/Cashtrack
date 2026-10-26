export class RestoreRollbackError extends Error {
  readonly originalError: unknown;
  readonly rollbackError: unknown;

  constructor(originalError: unknown, rollbackError: unknown) {
    super('Restore failed and the previous data could not be fully recovered.');
    this.name = 'RestoreRollbackError';
    this.originalError = originalError;
    this.rollbackError = rollbackError;
  }
}

export async function applyRestoreWithRollback<T>(
  snapshot: T,
  apply: () => Promise<void>,
  rollback: (snapshot: T) => Promise<void>,
): Promise<void> {
  try {
    await apply();
  } catch (error) {
    try {
      await rollback(snapshot);
    } catch (rollbackError) {
      throw new RestoreRollbackError(error, rollbackError);
    }
    throw error;
  }
}
