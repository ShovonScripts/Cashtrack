import { BillReminderForm } from '@/components/bill-reminder-form';
import { useFinancialReminders } from '@/context/financial-reminders-context';

export default function AddBillScreen() {
  const { addReminder } = useFinancialReminders();

  return (
    <BillReminderForm
      submitLabel="Save Reminder"
      onSubmit={async (draft) => {
        await addReminder(draft);
      }}
    />
  );
}
