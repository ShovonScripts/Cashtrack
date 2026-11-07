import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { StayInTouchCard } from '@/components/signup/stay-in-touch-card';
import { ThemedText } from '@/components/themed-text';
import { Button, ListRow, Section } from '@/components/ui';
import { FeatureColors, Spacing } from '@/constants/theme';
import { useDebts } from '@/context/debt-context';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useGoals } from '@/context/goal-context';
import { useIncome } from '@/context/income-context';
import { BACKUP_MIME_TYPE, createBackup, pickBackupFile, restoreBackup } from '@/storage/backup-service';
import { BackupParseError, parseBackup } from '@/utils/backup';
import { confirmAction, notify } from '@/utils/confirm';
import { generateCsvReport } from '@/utils/csv';
import { triggerHaptic } from '@/utils/motion';
import { RestoreRollbackError } from '@/utils/restore-rollback';

/** Saves text as a file: a download on the web, the share sheet on phones. */
async function shareTextFile(fileName: string, contents: string, mimeType: string, dialogTitle: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
  return true;
}

type DataTabProps = {
  /** Clears the unsaved profile edits after everything is erased. */
  onErased: () => void;
  onReplayWalkthrough: () => void;
};

/** Sign-up, export and backup, help, and erasing everything. */
export function DataTab({ onErased, onReplayWalkthrough }: DataTabProps) {
  const { expenses, resetAllData, reloadAllData } = useExpenses();
  const { preferences, country } = usePreferences();
  const { debts, reloadDebts } = useDebts();
  const { reloadGoals } = useGoals();
  const { reloadIncome } = useIncome();
  const { reloadReminders } = useFinancialReminders();
  const [busy, setBusy] = useState<'export' | 'backup' | 'restore' | null>(null);

  const reloadEverything = () => {
    reloadAllData();
    reloadDebts();
    reloadIncome();
    reloadGoals();
    reloadReminders();
  };

  const exportCsv = async () => {
    triggerHaptic();
    setBusy('export');
    try {
      const csv = generateCsvReport({ expenses, currencyCode: country.currencyCode });
      const shared = await shareTextFile(`CashTrack_Transactions_${Date.now()}.csv`, csv, 'text/csv', 'Export CashTrack transactions');
      if (!shared) notify('Export ready', 'The spreadsheet was created, but this phone has no app to share it with.');
    } catch {
      notify('Export failed', 'Could not export your transactions right now. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const backUp = async () => {
    triggerHaptic();
    setBusy('backup');
    try {
      const backup = await createBackup({ expenses, preferences, debts });
      await shareTextFile(backup.fileName, backup.json, BACKUP_MIME_TYPE, 'Save CashTrack backup');
      const skipped = backup.omittedAttachments > 0 ? ` ${backup.omittedAttachments} photo(s) could not be included.` : '';
      notify('Backup ready', `Everything was saved to ${backup.fileName}.${skipped} Keep it somewhere safe, like your cloud drive.`);
    } catch {
      notify('Backup failed', 'Could not create a backup file. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    if (Platform.OS === 'web') {
      notify('Not available on the web', 'Restoring a backup works in the iPhone and Android app.');
      return;
    }
    triggerHaptic();
    setBusy('restore');
    let raw: string | null;
    let preview: ReturnType<typeof parseBackup>;
    try {
      raw = await pickBackupFile();
      if (raw === null) return;
      preview = parseBackup(raw);
    } catch (error) {
      notify('Cannot restore', error instanceof BackupParseError ? error.message : 'That file could not be read. Choose a CashTrack backup file.');
      return;
    } finally {
      setBusy(null);
    }

    const summary = [
      `${preview.data.expenses.length} expenses`,
      `${preview.data.income.length} income entries`,
      `${preview.data.debts.length} debts`,
      `${preview.data.goals.length} pots`,
      `${preview.data.reminders.length} bills`,
      `${preview.data.notes.length} notes`,
    ].join(', ');
    const backupText = raw;

    confirmAction(
      'Replace everything with this backup?',
      `Everything on this phone will be replaced by the backup from ${preview.exportedAt.slice(0, 10)} (${summary}). This cannot be undone.`,
      async () => {
        setBusy('restore');
        try {
          const result = await restoreBackup(backupText);
          reloadEverything();
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          notify(
            'Backup restored',
            `${result.counts.expenses} expenses, ${result.counts.income} income entries, ${result.counts.goals} pots and ${result.counts.reminders} bills were restored.`,
          );
          router.replace('/(tabs)/menu');
        } catch (error) {
          if (!(error instanceof RestoreRollbackError)) reloadEverything();
          notify(
            'Restore failed',
            error instanceof RestoreRollbackError
              ? 'The backup could not be applied and your previous data could not be fully recovered. Restart the app before making changes.'
              : 'The backup could not be applied. Your previous data was kept.',
          );
        } finally {
          setBusy(null);
        }
      },
      'Replace everything',
    );
  };

  const eraseEverything = () => {
    triggerHaptic();
    confirmAction(
      'Erase all data?',
      'This permanently deletes your transactions, income, bills, debts, pots, notes and profile, and resets every setting.',
      () =>
        confirmAction(
          'Are you sure?',
          'This cannot be undone. Make a backup first if you might want your data back.',
          async () => {
            try {
              await resetAllData();
              onErased();
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              notify('Data erased', 'CashTrack has been reset to a fresh start.');
            } catch {
              notify('Erase failed', 'Could not erase all data. Please try again.');
            }
          },
          'Erase everything',
        ),
      'Continue',
    );
  };

  const open = (path: '/user-manual' | '/about' | '/privacy') => () => {
    triggerHaptic();
    router.push(path);
  };

  return (
    <>
      <StayInTouchCard />

      <Section title="Your data" subtitle="Your records live only on this phone. Back them up before changing phones.">
        <Card padded={false}>
          <ListRow
            title="Export transactions"
            subtitle="A spreadsheet (CSV) of every expense"
            icon="file-delimited-outline"
            color={FeatureColors.teal}
            trailing="share"
            busy={busy === 'export'}
            disabled={busy !== null && busy !== 'export'}
            onPress={() => void exportCsv()}
          />
          <CardDivider />
          <ListRow
            title="Back up everything"
            subtitle="One file with all data, photos and receipts"
            icon="database-export-outline"
            color={FeatureColors.blue}
            trailing="share"
            busy={busy === 'backup'}
            disabled={busy !== null && busy !== 'backup'}
            onPress={() => void backUp()}
          />
          <CardDivider />
          <ListRow
            title="Restore from a backup"
            subtitle={Platform.OS === 'web' ? 'Works in the iPhone and Android app' : 'Replaces everything on this phone'}
            icon="database-import-outline"
            color={FeatureColors.orange}
            busy={busy === 'restore'}
            disabled={busy !== null && busy !== 'restore'}
            onPress={() => void restore()}
          />
        </Card>
      </Section>

      <Section title="Help and info">
        <Card padded={false}>
          <ListRow
            title="Replay the walkthrough"
            subtitle="The welcome tour and tips"
            icon="compass-outline"
            color={FeatureColors.violet}
            onPress={() => {
              triggerHaptic();
              onReplayWalkthrough();
            }}
          />
          <CardDivider />
          <ListRow title="User Manual" subtitle="How every feature works" icon="book-open-page-variant-outline" color={FeatureColors.cyan} onPress={open('/user-manual')} />
          <CardDivider />
          <ListRow title="About CashTrack" subtitle="Privacy promise, support and version" icon="info" color={FeatureColors.slate} onPress={open('/about')} />
          <CardDivider />
          <ListRow title="Privacy Policy" subtitle="What is collected and your choices" icon="shield-lock-outline" color={FeatureColors.indigo} onPress={open('/privacy')} />
        </Card>
      </Section>

      <Section title="Danger zone" subtitle="Deletes everything on this phone and starts fresh.">
        <Button label="Erase all data" variant="danger" onPress={eraseEverything} />
      </Section>

      <ThemedText type="caption" themeColor="textSecondary" style={styles.note}>
        CashTrack keeps your money records on this phone. They are never uploaded.
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  note: { textAlign: 'center', paddingHorizontal: Spacing.three },
});
