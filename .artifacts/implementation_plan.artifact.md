# Alarm System for Financial Reminders Implementation Plan

Add a high-priority alarm notification mode with custom time selection and urgent sound/vibration channels for bills and financial reminders.

## User Review Required

> [!IMPORTANT]
> Alarm notifications require notification permissions on Android/iOS. On Android, high-importance notification channels are created with maximum priority (`AndroidImportance.MAX`) to ring loudly.

## Proposed Changes

### Data & Storage Layer
#### [MODIFY] [reminder.ts](file:///C:/xampp/htdocs/ProDo/App/spendly/src/types/reminder.ts)
- Add `isAlarm` and `alarmTime` properties to `FinancialReminder` and `ReminderDraft`.

#### [MODIFY] [financial-reminders-repository.ts](file:///C:/xampp/htdocs/ProDo/App/spendly/src/storage/financial-reminders-repository.ts)
- Update SQLite table schema, mapping, and CRUD operations to persist `is_alarm` and `alarm_time`.

### Notification Engine
#### [MODIFY] [reminder-notifications.ts](file:///C:/xampp/htdocs/ProDo/App/spendly/src/utils/reminder-notifications.ts)
- Configure Android high-importance notification channel (`reminder-alarms-channel`) with maximum importance, sound, and vibration.
- Update `scheduleReminderNotificationsAsync` to handle custom `alarmTime` and `isAlarm`.

### UI Layer
#### [MODIFY] [add.tsx](file:///C:/xampp/htdocs/ProDo/App/spendly/src/app/bills/add.tsx)
- Add "High-Priority Alarm Mode" toggle switch and alarm time selector.

#### [MODIFY] [index.tsx](file:///C:/xampp/htdocs/ProDo/App/spendly/src/app/bills/index.tsx)
- Display alarm badge on reminder list items when alarm mode is enabled.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` and `npx expo lint`.

### Manual Verification
- Create a new bill with Alarm Mode enabled and verify notifications are scheduled correctly.
