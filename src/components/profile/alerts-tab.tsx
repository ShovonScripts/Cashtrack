import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Button, Section, SwitchRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { notify } from '@/utils/confirm';
import { triggerHaptic } from '@/utils/motion';
import { registerForBudgetNotificationsAsync } from '@/utils/notifications';
import { requestQuoteNotificationPermissionsAsync } from '@/utils/quote-notifications';
import { requestNotificationPermissionsAsync, scheduleTestAlarmNotificationAsync } from '@/utils/reminder-notifications';
import { requestSpendingReminderPermissionsAsync } from '@/utils/spending-reminder-notifications';

/**
 * Turning a reminder on first asks for notification permission. If it is
 * refused, the switch stays off and says why, so it never looks on while
 * nothing can arrive.
 */
function withPermission(request: () => Promise<boolean>, what: string, apply: (on: boolean) => void) {
  return async (on: boolean) => {
    triggerHaptic();
    if (on && !(await request())) {
      notify('Notifications are off', `Allow notifications for CashTrack in your phone’s Settings to get ${what}.`);
      return;
    }
    apply(on);
  };
}

/** Reminders and alerts. They apply straight away; no Save needed. */
export function AlertsTab() {
  const {
    enableBillReminders,
    setEnableBillReminders,
    enableBudgetAlerts,
    setEnableBudgetAlerts,
    enableDailyReminder,
    setEnableDailyReminder,
    enableDailyQuotes,
    setEnableDailyQuotes,
    showLaunchQuote,
    setShowLaunchQuote,
  } = usePreferences();
  const [testing, setTesting] = useState(false);

  const testAlarm = async () => {
    triggerHaptic();
    setTesting(true);
    try {
      const scheduled = await scheduleTestAlarmNotificationAsync();
      notify(
        scheduled ? 'Test alarm on its way' : 'Notifications are off',
        scheduled
          ? 'A test notification arrives in 5 seconds. Turn off silent mode to hear it.'
          : 'Allow notifications for CashTrack in your phone’s Settings to hear the alarm.',
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Section title="Money reminders">
        <Card padded={false}>
          <SwitchRow
            label="Bill reminders"
            description="Before bills and EMIs are due"
            value={enableBillReminders}
            onValueChange={withPermission(requestNotificationPermissionsAsync, 'bill reminders', setEnableBillReminders)}
          />
          <CardDivider />
          <SwitchRow
            label="Budget warnings"
            description="When a category reaches 80% and 100% of its limit"
            value={enableBudgetAlerts}
            onValueChange={withPermission(registerForBudgetNotificationsAsync, 'budget warnings', setEnableBudgetAlerts)}
          />
          <CardDivider />
          <SwitchRow
            label="Daily check-in"
            description="An evening nudge to log today’s spending"
            value={enableDailyReminder}
            onValueChange={withPermission(requestSpendingReminderPermissionsAsync, 'the daily check-in', setEnableDailyReminder)}
          />
        </Card>
      </Section>

      <Section title="Motivation">
        <Card padded={false}>
          <SwitchRow
            label="Morning quote"
            description="A money quote at 8:00 AM"
            value={enableDailyQuotes}
            onValueChange={withPermission(requestQuoteNotificationPermissionsAsync, 'the morning quote', setEnableDailyQuotes)}
          />
          <CardDivider />
          <SwitchRow
            label="Quote when the app opens"
            description="A new quote each time you open CashTrack"
            value={showLaunchQuote}
            onValueChange={(on) => {
              triggerHaptic();
              setShowLaunchQuote(on);
            }}
          />
        </Card>
      </Section>

      <Section title="Check your sound" subtitle="Sends a test notification in 5 seconds.">
        <Button label="Send a test alarm" variant="secondary" onPress={() => void testAlarm()} loading={testing} />
      </Section>

      <ThemedText type="caption" themeColor="textSecondary" style={styles.note}>
        Reminders are scheduled on your phone. Nothing is sent to a server.
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  note: { textAlign: 'center', paddingHorizontal: Spacing.three },
});
