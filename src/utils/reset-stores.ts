export type StoreResetSteps = {
  clearRestoreJournal: () => Promise<void>;
  resetProviders: () => Promise<void>;
  clearRelationalData: () => Promise<void>;
  clearAuxiliaryData: () => Promise<void>;
};

/**
 * Order matters: drop the pending-restore journal first, let providers finish
 * in-flight writes and reset their memory, and only then delete the stores.
 * Reversing this lets a late write repopulate data that was just cleared, and
 * leaving the journal behind can replay an old restore after "start fresh".
 *
 * Any failure aborts the remaining steps so the caller never reports a reset
 * that only partially cleared storage.
 */
export async function clearStoresInSafeOrder(steps: StoreResetSteps): Promise<void> {
  await steps.clearRestoreJournal();
  await steps.resetProviders();
  await steps.clearRelationalData();
  await steps.clearAuxiliaryData();
}
