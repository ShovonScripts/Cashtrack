import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ManualIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type ManualBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'table'; headers: [string, string]; rows: [string, string][] };

export type ManualSection = {
  id: string;
  title: string;
  summary: string;
  icon: ManualIcon;
  color: string;
  blocks: ManualBlock[];
};

export const USER_MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'welcome',
    title: 'Welcome to CashTrack',
    summary: 'What the app does, how local-first storage works, and platform support.',
    icon: 'hand-wave',
    color: '#0152F5',
    blocks: [
      {
        type: 'paragraph',
        text: 'CashTrack helps you see where your money goes without sending your financial records to a cloud service.',
      },
      { type: 'heading', text: 'You can use CashTrack to' },
      {
        type: 'bullets',
        items: [
          'Record expenses and income.',
          'Set monthly spending caps by category.',
          'Track bills, subscriptions, EMIs, and renewals.',
          'Track money you lend and money you borrow.',
          'Build savings pots toward targets.',
          'View daily, weekly, monthly, and yearly spending reports.',
          'Export a PDF or CSV report.',
          'Use built-in notes, a calculator, a stopwatch, a currency converter, world clocks, and weather.',
        ],
      },
      { type: 'heading', text: 'Local-first by design' },
      {
        type: 'bullets',
        items: [
          'There is no CashTrack account and no sign-in.',
          'CashTrack does not connect to your bank. You enter records yourself.',
          'Your records are stored on your device.',
          'CashTrack does not sync your data to a cloud account.',
          'Weather and currency conversion use the internet only for those features. Your financial records are not uploaded for them.',
          'You are responsible for making backups before changing devices or uninstalling the app.',
        ],
      },
      { type: 'heading', text: 'Platform notes' },
      {
        type: 'table',
        headers: ['Feature', 'Availability'],
        rows: [
          ['Expense, income, budget, debt, pot, and bill tracking', 'iOS, Android, and web'],
          ['PDF and CSV export', 'iOS, Android, and web'],
          ['Restore from backup', 'iOS and Android only'],
          ['App Lock', 'iOS and Android only'],
          ['Notifications and alarms', 'iOS and Android only'],
          ['Weather and currency rates', 'All platforms when online'],
        ],
      },
      {
        type: 'note',
        text: 'The best experience is the installed iOS or Android app.',
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'Onboarding, currency, and your first expense, budget, bill, pot, and debt.',
    icon: 'rocket-launch-outline',
    color: '#0EA5E9',
    blocks: [
      { type: 'heading', text: 'Finish onboarding' },
      {
        type: 'steps',
        items: [
          'Read each slide.',
          'Use **Next** to move forward, **Back** to return, or **Skip** to close the walkthrough.',
          'Tap **Get Started** on the last slide.',
        ],
      },
      {
        type: 'note',
        text: 'Open the walkthrough again from **Profile & settings → Data & Privacy → Replay App Walkthrough**.',
      },
      { type: 'heading', text: 'Choose your country and currency' },
      {
        type: 'steps',
        items: [
          'During onboarding, tap **Change Country or Currency**, or use **Menu Hub → Country & Currency** later.',
          'Search for a country or currency code.',
          'Tap the country.',
          'CashTrack uses that country’s currency symbol and code throughout the app.',
        ],
      },
      {
        type: 'note',
        text: 'Changing the country or currency changes the currency label only. It does not convert existing amounts. Choose the currency your saved amounts are already in.',
      },
      { type: 'heading', text: 'Record your first expense' },
      {
        type: 'steps',
        items: [
          'Tap the large **+** button in the middle of the bottom tab bar.',
          'Tap **Add Expense**.',
          'Choose the date.',
          'Choose a category.',
          'Enter the amount using the keypad. You can type a simple sum such as 12.50 + 4.75.',
          'Add an optional note.',
          'Tap **Save expense**.',
        ],
      },
      {
        type: 'paragraph',
        text: 'You can also tap **Add expense** on the Daily Cost card on Home, or use the **+** button on the Transactions & Expenses screen.',
      },
      { type: 'heading', text: 'Set your first budget' },
      {
        type: 'steps',
        items: [
          'Open **Menu Hub**.',
          'Tap **Budget Caps & Limits**.',
          'Find a category, such as Food.',
          'Enter a monthly amount in **Set monthly cap**.',
          'Tap **Save**.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Each category shows **Active**, **Over Limit**, or **No Limit**.',
      },
      { type: 'heading', text: 'Add your first bill' },
      {
        type: 'steps',
        items: [
          'Open **Menu Hub → Bills & Reminders**.',
          'Tap **Add Bill**.',
          'Enter the bill name and amount.',
          'Choose a category and due date.',
          'Choose a repeat frequency.',
          'Tap **Save Reminder**.',
        ],
      },
      {
        type: 'paragraph',
        text: 'You can also use the **+** button and choose **Add Bill / Reminder**.',
      },
      { type: 'heading', text: 'Create your first savings pot' },
      {
        type: 'steps',
        items: [
          'Tap the **+** button.',
          'Tap **New Savings Pot**.',
          'Choose a pot category: General, Junior, Emergency, or Milestone.',
          'Enter a pot title.',
          'Enter a target amount, or leave it blank for an open-ended pot.',
          'Choose an allocation rule and frequency.',
          'Tap **Create Savings Pot**.',
        ],
      },
      { type: 'heading', text: 'Record money you lent or borrowed' },
      {
        type: 'steps',
        items: [
          'Tap the **+** button.',
          'Tap **Add Debt / Loan**.',
          'Choose **I Lent Money** or **I Borrowed Money**.',
          'Enter the person’s name and the amount.',
          'Choose whether the debt should affect your main balance.',
          'Add a due date if needed.',
          'Tap **Save Debt**.',
        ],
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigating CashTrack',
    summary: 'Tabs, Quick Record, floating tools, Home, and the Menu Hub.',
    icon: 'compass-outline',
    color: '#0284C7',
    blocks: [
      { type: 'heading', text: 'The five tabs' },
      {
        type: 'table',
        headers: ['Tab', 'What it does'],
        rows: [
          ['Home', 'Overview of balance, spending, bills, pots, debts, and recent activity'],
          ['Expenses', 'Searchable expense ledger with category filters'],
          ['Add', 'Opens the Quick Record menu'],
          ['Analytics', 'Monthly reports, charts, and exports'],
          ['Menu', 'All tools, financial screens, and settings'],
        ],
      },
      { type: 'heading', text: 'Quick Record' },
      {
        type: 'paragraph',
        text: 'Tap the center **+** button to open **Quick Record**:',
      },
      {
        type: 'bullets',
        items: [
          '**Add Expense** — outflows, shopping, and receipts',
          '**Add Income** — salary, freelance, and side cash',
          '**Add Bill / Reminder** — rent, subscriptions, and EMIs',
          '**Add Debt / Loan** — money lent or borrowed',
          '**New Savings Pot** — stash cash, target optional',
        ],
      },
      { type: 'heading', text: 'Floating Quick Tools' },
      {
        type: 'bullets',
        items: [
          '**Quick Calculator**',
          '**Currency Converter**',
          '**Keep Notes**',
          '**Stopwatch & Timer**',
          '**Calendar**',
          '**Quick Expense**',
        ],
      },
      {
        type: 'paragraph',
        text: 'The button follows you across screens. When the stopwatch is running, it turns into a compact stopwatch pill.',
      },
      { type: 'heading', text: 'Home screen' },
      {
        type: 'bullets',
        items: [
          'Swipe through **Cover**, **Weather**, and **Daily wisdom**.',
          'Tap the profile area to open Profile & settings.',
          'Tap the year-progress chip to switch between your greeting and year progress.',
          '**TOTAL BALANCE** is all recorded income minus all recorded expenses.',
          '**SPENT IN [MONTH]** and **AVG / DAY** show current-month spending.',
          'Swipe through **Yesterday**, **Daily**, **Weekly**, **Monthly**, and **Yearly** cost cards.',
          'Tap a cost card to open its report. The Daily card also has **Add expense**.',
          'Swipe through **Monthly cash flow**, **Lend & borrow**, and **Money plan & pots**.',
          'The **Bills & Reminders** widget links to **Subscriptions & Recurring Hub**.',
          'The **Spending advisor** card gives a monthly check-in.',
          '**This week** shows a seven-day spending chart. Tap a day for its total.',
          '**Recent activity** shows your latest expenses with category filters and **See all**.',
        ],
      },
      { type: 'heading', text: 'Menu Hub' },
      {
        type: 'paragraph',
        text: 'Menu Hub contains a searchable list of every screen and tool. Search for terms such as calculator, notes, stopwatch, or bills. Open **User Manual & Help** for a searchable, in-app version of this guide.',
      },
      {
        type: 'bullets',
        items: [
          'Filter chips: **All**, **Finances**, **Utility Tools**, **Insights & Analytics**, and **Preferences**.',
          'Sections: **UTILITY TOOLS**, **FINANCIAL MANAGEMENT**, **INTELLIGENCE & REPORTS**, and **PREFERENCES & SYSTEM**.',
          'The moon/sun button in the top-right toggles the theme.',
        ],
      },
    ],
  },
  {
    id: 'expenses',
    title: 'Expenses',
    summary: 'Search, add, edit, repeat, and categorize your spending.',
    icon: 'receipt',
    color: '#159A8C',
    blocks: [
      { type: 'heading', text: 'Browse and search expenses' },
      {
        type: 'bullets',
        items: [
          'Open the **Expenses** tab. The screen is titled **Transactions & Expenses**.',
          'Search by note, category, or amount.',
          'Filter by category using the chips.',
          'Totals update to show the filtered amount.',
          'Expenses are grouped by date.',
          'Tap an expense to open its details.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The summary card shows the total, the number of expenses, and the average per item.',
      },
      { type: 'heading', text: 'Add an expense' },
      {
        type: 'paragraph',
        text: 'Use any of these routes: center **+ → Add Expense**, the Daily Cost card’s **Add expense**, the Expenses tab **+** button, or **Floating tools → Quick Expense**.',
      },
      {
        type: 'steps',
        items: [
          '**Date**',
          '**CATEGORY**',
          '**AMOUNT / EXPRESSION**',
          '**NOTE / MEMO (OPTIONAL)**',
          '**RECURRING EXPENSE**',
        ],
      },
      {
        type: 'paragraph',
        text: 'The amount keypad supports addition and subtraction. For example, 25 + 7.50 - 2 is saved as 30.50. If the expense would take a category over its monthly limit, a warning appears before you save.',
      },
      { type: 'heading', text: 'Recurring expenses' },
      {
        type: 'paragraph',
        text: 'Turn on **RECURRING EXPENSE** and choose Weekly, Monthly, or Yearly.',
      },
      {
        type: 'bullets',
        items: [
          'CashTrack creates due occurrences automatically when the app opens.',
          'It does not create duplicates for the same period.',
          'Generated entries include a recurring note.',
          'There is no recurring end-date field. To stop a series, delete the original recurring expense.',
          'Deleting the original recurring expense also removes the occurrences it generated.',
          'Deleting one generated occurrence skips that period instead of deleting the whole series.',
        ],
      },
      { type: 'heading', text: 'Expense details and editing' },
      {
        type: 'bullets',
        items: [
          'Tap an expense to see its amount, category, date, note, and receipt photo if one is already attached.',
          '**Edit** lets you change the amount, date, category, and note.',
          'The edit form does not include recurring controls or receipt controls.',
          'Deleting asks for confirmation and cannot be undone.',
        ],
      },
      { type: 'heading', text: 'Receipts' },
      {
        type: 'paragraph',
        text: 'Receipt photos are supported by the data model and appear on the detail screen if present. The current add/edit screens do not provide a button to attach, replace, or remove a receipt. Receipts already present in a restored backup will display normally.',
      },
      { type: 'heading', text: 'Manage categories' },
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Categories Manager**. The screen is labeled **EXPENSE CATEGORIES & ICONS** and shows total categories, active categories, built-in categories, and the number of custom categories.',
      },
      {
        type: 'bullets',
        items: [
          'Add a category with a unique name and an icon from the icon pack.',
          'Rename custom categories.',
          'Delete custom categories.',
          'Reorder categories with the up/down arrows. The order is used in forms and reports.',
          'Built-in categories are Food, Transport, Shopping, Bills, Health, Entertainment, and Other.',
          'A category cannot be deleted while expenses still use it. Move or recategorize those expenses first.',
        ],
      },
    ],
  },
  {
    id: 'budgets',
    title: 'Budgets and Spending Caps',
    summary: 'Category caps, warnings, alerts, and the Spending Advisor.',
    icon: 'scale-balance',
    color: '#BB6BD9',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Budget Caps & Limits**. The main card is labeled **SPENDING CAPS & BUDGETS**.',
      },
      { type: 'heading', text: 'Set a category cap' },
      {
        type: 'steps',
        items: [
          'Find the category.',
          'Enter a monthly amount in **Set monthly cap**.',
          'Tap **Save**.',
        ],
      },
      {
        type: 'bullets',
        items: [
          '**Active** — a cap is set and spending is within it.',
          '**Over Limit** — spending is above the cap.',
          '**No Limit** — no cap is set.',
          'The top of the screen shows your **TOTAL BUDGET CAP** across all categories.',
        ],
      },
      { type: 'heading', text: 'Remove a cap' },
      {
        type: 'paragraph',
        text: 'Tap the remove button beside a saved category cap. The category returns to **No Limit**.',
      },
      { type: 'heading', text: 'Budget warnings' },
      {
        type: 'bullets',
        items: [
          'At 80% or more, CashTrack shows a heads-up.',
          'At 100%, it warns that the full limit will be used.',
          'Above 100%, it shows how far over the limit the expense would take you.',
        ],
      },
      { type: 'heading', text: 'Budget alerts' },
      {
        type: 'paragraph',
        text: 'Enable **Budget Caps** in **Profile & settings → Alerts** and allow notifications. CashTrack can alert you at 80%, 100%, and over the cap. Alerts escalate only upward. Editing or deleting an expense does not trigger a lower-level alert.',
      },
      { type: 'heading', text: 'Important behavior' },
      {
        type: 'note',
        text: 'Budgets are saved per category, not per calendar month. The same monthly cap is reused each month until you change or remove it. The confirmation message may mention the current month, but the cap itself persists.',
      },
      { type: 'heading', text: 'Spending Advisor' },
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Spending Advisor** or use the Home screen card. The advisor checks current-month spending against your caps and highlights categories that are over the limit, close to the limit, or spending faster than a comfortable pace.',
      },
    ],
  },
  {
    id: 'income',
    title: 'Income',
    summary: 'Record salary and side cash, edit entries, and auto-save to pots.',
    icon: 'wallet-plus-outline',
    color: '#7667F2',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Income Streams**. The main card shows **TOTAL MONEY IN (ALL TIME)** and the number of income records.',
      },
      { type: 'heading', text: 'Add income' },
      {
        type: 'steps',
        items: [
          'Enter the amount.',
          'Add an optional **Source / Note**.',
          'Choose the date.',
          'Turn on **Recurring Income** if needed.',
          'Choose Monthly, Weekly, or Yearly.',
          'Tap **Add Money In**.',
        ],
      },
      { type: 'heading', text: 'Edit or delete income' },
      {
        type: 'paragraph',
        text: 'Each income entry has edit and delete buttons. Editing opens the same form and changes the button to **Update Money In**. Deleting an income entry asks for confirmation.',
      },
      { type: 'heading', text: 'Recurring income' },
      {
        type: 'bullets',
        items: [
          'Recurring income creates due entries automatically when the app opens.',
          'There is no recurring end-date field.',
          'Deleting a generated occurrence skips that period.',
          'Deleting the original recurring entry removes the entries it generated.',
        ],
      },
      { type: 'heading', text: 'Auto-save from income' },
      {
        type: 'paragraph',
        text: 'If you create a pot with **Auto-Save %**, CashTrack allocates that percentage of newly recorded income to the pot automatically. Allocation is capped so it never exceeds the pot target or the available income.',
      },
    ],
  },
  {
    id: 'pots',
    title: 'Savings Pots and Goals',
    summary: 'Create pots, choose allocation rules, and track contributions.',
    icon: 'piggy-bank-outline',
    color: '#27AE60',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Savings Goals & Pots**. The top card shows **ACTIVE SAVED** and **ACTIVE TARGETS**. Filter tabs are **active**, **completed**, and **all**, each with a count. Tap **+ New pot** to create a pot.',
      },
      { type: 'heading', text: 'Create a pot' },
      {
        type: 'steps',
        items: [
          'Choose a savings category.',
          'Enter a **Pot Title**.',
          'Enter a **Target Amount**, or leave it blank for an open-ended pot.',
          'Choose a **Savings Allocation Rule**.',
          'If you choose Auto-Save %, set the percentage.',
          'Choose a frequency: Monthly, Weekly, Daily, Quarterly, Half-Yearly, or Yearly.',
          'Tap **Create Savings Pot**.',
        ],
      },
      {
        type: 'bullets',
        items: [
          '**General** — everyday cash buffer and flexible goals',
          '**Junior** — kids, education, and family futures',
          '**Emergency** — a safety net for unexpected events',
          '**Milestone** — vacations, vehicles, and big purchases',
          '**Auto-Save %** — save a percentage of earnings automatically',
          '**Flexible Stash** — add cash anytime with no fixed rules',
          '**Manual Only** — contribute only when you choose',
        ],
      },
      {
        type: 'note',
        text: 'Auto-Save percentages across all active pots cannot exceed 100% of income.',
      },
      { type: 'heading', text: 'Pot details' },
      {
        type: 'bullets',
        items: [
          'Saved amount and target.',
          'Status: **Active**, **Open-ended**, or **Completed**.',
          'Progress percentage, progress bar, and remaining amount.',
          'Expected progress and ahead/behind status.',
          'Milestones at 25%, 50%, 75%, and 100%.',
          '**Add contribution**, **Contribution history**, **Edit**, and **Delete Pot / Goal**.',
        ],
      },
      { type: 'heading', text: 'Add a contribution' },
      {
        type: 'steps',
        items: ['Enter an amount.', 'Tap **Contribute**.'],
      },
      {
        type: 'note',
        text: 'If the contribution reaches the target, the pot is marked complete. Contributions are tracked inside the pot. They are not automatically recorded as an expense or deducted from your main balance.',
      },
      { type: 'heading', text: 'Edit or delete a pot' },
      {
        type: 'bullets',
        items: [
          '**Edit** lets you change the pot’s details and allocation.',
          '**Delete Pot / Goal** permanently removes the pot and its contribution history.',
          'Individual contributions can be deleted from the history.',
        ],
      },
    ],
  },
  {
    id: 'debts',
    title: 'Debts and IOUs',
    summary: 'Track money you lend and borrow, partial payments, and settlements.',
    icon: 'account-cash-outline',
    color: '#2D9CDB',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Debts & IOUs**. The summary shows **YOU ARE OWED**, **YOU OWE**, and your **Net Position**. Filter tabs are **Active**, **All**, **Settled**, **Lent**, and **Borrowed**.',
      },
      { type: 'heading', text: 'Add a debt' },
      {
        type: 'steps',
        items: [
          'Choose **I Lent Money** or **I Borrowed Money**.',
          'Enter the **PERSON NAME**.',
          'Enter the **AMOUNT**.',
          'Choose whether it should **Affect main balance**.',
          'Choose the **TRANSACTION DATE**.',
          'Optionally enable a **DUE DATE**.',
          'Add an optional **NOTE**.',
          'Tap **Save Debt**.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Lent money can be logged as an expense. Borrowed money can be logged as income.',
      },
      { type: 'heading', text: 'Debt details' },
      {
        type: 'bullets',
        items: [
          'Original total, amount paid, and remaining balance.',
          'Status: **Active**, **Paid Off**, or **Settled**.',
          'Due date and note.',
          'Payment history.',
          '**Record Partial Payment**, **Settle Full**, **Reminder**, and **Delete**.',
        ],
      },
      { type: 'heading', text: 'Partial payments and settlement' },
      {
        type: 'bullets',
        items: [
          '**Record Partial Payment** tracks a payment against the debt.',
          'Partial payments are not automatically added to the expense ledger.',
          '**Settle Full** marks the entire debt as settled.',
          'Settling does not create an expense or income entry.',
          '**Reminder** opens the system share sheet with a prepared message.',
        ],
      },
      {
        type: 'note',
        text: 'Use **Affect main balance** when creating the debt if you want the original transaction reflected in your ledger. Deleting a debt record cannot be undone.',
      },
    ],
  },
  {
    id: 'bills',
    title: 'Bills and Reminders',
    summary: 'Add bills, mark payments, skip cycles, and use the renewal calendar.',
    icon: 'calendar-clock',
    color: '#EB5757',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Bills & Reminders**. The top card shows **TOTAL DUE** for the current month, overdue count, due-today count, and **All Clear** when nothing is outstanding. Filter tabs are **All**, **Due Today**, **Overdue**, **Upcoming**, and **Paid**.',
      },
      { type: 'heading', text: 'Add a bill' },
      {
        type: 'steps',
        items: [
          'Tap **Add Bill**.',
          'Enter the **BILL / REMINDER NAME**.',
          'Enter the **AMOUNT**, or turn on **Amount varies**.',
          'Choose a **CATEGORY**.',
          'If you choose EMI, optionally enter the total loan amount and number of installments.',
          'Choose the **DUE DATE**.',
          'Optionally enable **High-Priority Alarm Mode** and set an exact alarm time.',
          'Choose the **REPEAT FREQUENCY**: One-time, Weekly, Monthly, or Yearly.',
          'Tap **Save Reminder**.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Bill categories are Bills, EMI, Loan, Rent, Credit Card, Insurance, Subscription, Education, Tax, Utilities, and Other.',
      },
      { type: 'heading', text: 'Mark a bill as paid' },
      {
        type: 'steps',
        items: [
          'Tap **Mark Paid** on the bill, or open it from the list.',
          'Confirm the **PAYMENT AMOUNT**.',
          'Choose the **PAYMENT DATE**.',
          'Leave **Record as an expense** on if you want the payment added to your expense ledger and budgets.',
          'Add an optional note.',
          'Tap **Confirm Payment**.',
        ],
      },
      {
        type: 'paragraph',
        text: 'For a recurring bill, a full payment advances the bill to its next due date. For a one-time bill, marking it paid closes it.',
      },
      { type: 'heading', text: 'Skip or delete' },
      {
        type: 'bullets',
        items: [
          'Recurring bills have a **Skip** action. Skipping advances the bill to its next cycle without recording an expense.',
          'Deleting a reminder asks for confirmation and removes the bill and its scheduled notifications.',
        ],
      },
      { type: 'heading', text: 'Bill calendar' },
      {
        type: 'bullets',
        items: [
          'Open **Menu Hub → Bill & Renewal Calendar**, or tap the calendar banner on the Bills screen.',
          'Use the arrows to change month.',
          'Tap a day to see its bills.',
          'Tap a bill to open its payment screen.',
        ],
      },
      {
        type: 'note',
        text: 'The calendar always uses Sunday as the first day of the week, regardless of the **First Day of Week** preference.',
      },
      { type: 'heading', text: 'Subscriptions and recurring hub' },
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Subscriptions & Recurring Hub**, or tap the link on Home. The screen shows **MONTHLY OUTFLOW**, **ACTIVE RENEWALS**, renewal countdowns, and **Add recurring bill**. The monthly outflow converts weekly, monthly, and yearly bills to a monthly estimate.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports and Exports',
    summary: 'Monthly analytics, daily reports, PDF/CSV exports, and all-time CSV.',
    icon: 'chart-box-outline',
    color: '#C17A24',
    blocks: [
      { type: 'heading', text: 'Analytics & Reports' },
      {
        type: 'paragraph',
        text: 'Open the **Analytics** tab. All report totals and charts are based on expenses. Income is tracked separately and is not included in these reports.',
      },
      {
        type: 'bullets',
        items: [
          'Month selector with **Previous month** and **Next month**.',
          '**Month to Date** or **Full Month Report**.',
          '**TOTAL MONTHLY SPENDING**, expense count, category count, and over-limit count.',
          'Metrics: **DAILY AVG**, **VS PREV MONTH**, and **BUDGET USED**.',
          '**6-Month Spending Trend** — tap a month bar to switch the report to that month.',
          '**Category Proportions** — tap a category to see its share of the monthly total.',
          '**Category Breakdown** — monthly spending versus category limits.',
        ],
      },
      { type: 'heading', text: 'Monthly exports' },
      {
        type: 'bullets',
        items: [
          '**Monthly PDF Report** — formatted PDF with the monthly breakdown. On the web, CashTrack opens a print-ready tab; choose **Save as PDF**. On iOS/Android, the system share/save sheet opens.',
          '**Monthly CSV File** — raw monthly data for Excel or Google Sheets. On the web, the CSV downloads; on iOS/Android, the share sheet opens.',
          'Monthly CSV columns: **Date, Category, Amount, Currency, Memo**.',
        ],
      },
      { type: 'heading', text: 'Daily report' },
      {
        type: 'paragraph',
        text: 'Tap the Daily or Yesterday cost card on Home. The **Daily Expense Breakdown** screen shows total daily spending, largest expense, average, top category, category breakdown, transactions for the date, and **Download PDF**. Use the arrows to move between days.',
      },
      { type: 'heading', text: 'Weekly and yearly reports' },
      {
        type: 'paragraph',
        text: 'Tap the Weekly or Yearly cost card on Home. These period reports show category breakdown, share of period spending, and transactions.',
      },
      {
        type: 'note',
        text: 'Weekly and yearly period reports do not have an export button. Use the monthly PDF/CSV or the daily PDF instead.',
      },
      { type: 'heading', text: 'All-time CSV from Profile' },
      {
        type: 'paragraph',
        text: 'Open **Profile & settings → Data & Privacy → Export CSV Spreadsheet**. This exports your full recorded expense ledger, not just one month. The columns are the same as the monthly CSV.',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Notes and Tools',
    summary: 'Notes, calculator, stopwatch, clocks, currency, weather, and calendar.',
    icon: 'toolbox-outline',
    color: '#F2994A',
    blocks: [
      { type: 'heading', text: 'Keep Notes' },
      {
        type: 'bullets',
        items: [
          'Open **Menu Hub → Keep Notes** or use the floating tools menu.',
          'The header shows the number of saved notes.',
          'Search notes by title or content.',
          'Switch between grid and list view.',
          'Tap a note to edit it, or tap **+** to add a note.',
          'Notes support colors and are stored locally.',
          'Delete a note from its editor.',
        ],
      },
      { type: 'heading', text: 'Quick Calculator' },
      {
        type: 'bullets',
        items: [
          'Supports addition, subtraction, multiplication, division, and percentages.',
          'Keeps the last 10 calculations in history.',
          'Tap a history item to reuse it.',
          'Clear history with the history header action.',
        ],
      },
      { type: 'heading', text: 'Stopwatch & Timer' },
      {
        type: 'bullets',
        items: [
          '**Start** and **Pause**.',
          '**Lap** while running.',
          '**Reset** when paused.',
          '**LAP TIMES** history and clear lap times.',
        ],
      },
      {
        type: 'note',
        text: 'The stopwatch is not saved across an app reload; it starts fresh when the app is reopened.',
      },
      { type: 'heading', text: 'World Clocks' },
      {
        type: 'bullets',
        items: [
          'The screen is titled **World Clocks**.',
          'It shows **Pinned Timezones (N)**.',
          'Tap **Add City** to search by city or country.',
          'Tap a pinned city’s remove button to unpin it.',
        ],
      },
      { type: 'heading', text: 'Currency Converter' },
      {
        type: 'bullets',
        items: [
          'Choose **CONVERT FROM** and the target currency.',
          'Enter an amount.',
          'Use the swap button to reverse the pair.',
          'Popular currencies are available as shortcuts.',
          'Rates refresh from an online source when available.',
          'If the network is unavailable, CashTrack uses its cached or offline rate table.',
        ],
      },
      {
        type: 'note',
        text: 'Currency conversion does not change your app’s accounting currency. To change the accounting currency, use **Menu Hub → Country & Currency**.',
      },
      { type: 'heading', text: 'Weather & Insights' },
      {
        type: 'bullets',
        items: [
          'Tap the Weather slide on Home, or open **Menu Hub → Weather & Insights**.',
          'Shows current conditions and location.',
          '**Night View** or **Day View**.',
          '**SMART MONEY & WEATHER** or **Today’s insight**.',
          '**24-HOUR FORECAST** and **5-DAY FORECAST**.',
          'Rain, humidity, wind, and high/low metrics.',
        ],
      },
      {
        type: 'note',
        text: 'Location permission is needed for live weather. If weather cannot be loaded, CashTrack shows sample data and an offline banner. Pull down to retry.',
      },
      { type: 'heading', text: 'Calendar' },
      {
        type: 'paragraph',
        text: 'The Calendar tool in the floating menu opens the bill and renewal calendar.',
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile and Preferences',
    summary: 'Identity, theme, regional formats, alerts, data tools, and About.',
    icon: 'account-cog-outline',
    color: '#828282',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Menu Hub → Profile & Preferences**, or tap your profile on Home. The screen is titled **Profile & settings**.',
      },
      { type: 'heading', text: 'Identity' },
      {
        type: 'bullets',
        items: [
          'Profile photo and banner image.',
          '**Nickname**, **Financial Goal / Bio**, **Age**, and **Gender** (Woman, Man, or Other).',
          '**Private** badge.',
          'Stats: **Logged**, **Currency**, **Pots**, and **Tags** (custom categories).',
        ],
      },
      {
        type: 'paragraph',
        text: 'If you leave the nickname blank, the app displays **CashTrack User**. If you leave the bio blank, it displays a private/offline message.',
      },
      {
        type: 'paragraph',
        text: 'Tap the banner or edit control to open **Choose Banner Preset**. Presets are **Emerald Wealth**, **Cosmic Dark**, **Golden Luxury**, **Cyber Dusk**, and **Ocean Serenity**. You can also upload a custom photo.',
      },
      {
        type: 'paragraph',
        text: 'The **Setup: N%** progress is based on six items: name, profile photo, cover/banner, bio, age, and gender.',
      },
      { type: 'heading', text: 'Save profile changes' },
      {
        type: 'paragraph',
        text: 'When you change identity details, a floating bar appears with **Unsaved Changes**, **Save updates**, **Discard**, and **Save**. Age must be a whole number from 1 to 120.',
      },
      { type: 'heading', text: 'Preferences' },
      {
        type: 'bullets',
        items: [
          '**App Theme & Styling** — Auto, Light, or Dark.',
          '**Privacy & Security** — App Lock.',
          '**Country & Currency** — changes the currency label, not existing amounts.',
          '**Temperature Unit** — °F or °C.',
          '**First Day of Week** — Mon or Sun.',
        ],
      },
      {
        type: 'note',
        text: 'The First Day of Week setting affects weekly summaries and reports. The bill calendar still starts on Sunday.',
      },
      { type: 'heading', text: 'Alerts' },
      {
        type: 'bullets',
        items: [
          '**Bill Reminders** — upcoming bills and EMIs.',
          '**Budget Caps** — 80% and 100% cap warnings.',
          '**Daily Check-in** — a daily reminder.',
          '**Daily Motivation** — daily quote notifications.',
          '**Test Alarm Sound** — sends a test notification after 5 seconds.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Each toggle asks for notification permission when needed. If permission is denied, CashTrack shows a message directing you to device settings.',
      },
      { type: 'heading', text: 'Data & Privacy' },
      {
        type: 'bullets',
        items: [
          '**Export CSV Spreadsheet** — full recorded expense ledger.',
          '**Back Up All Data** — JSON file with photos and receipts.',
          '**Restore From Backup** — native app only.',
          '**Replay App Walkthrough**.',
          '**User Manual** — this searchable guide.',
          '**About CashTrack**.',
          '**Danger Zone → Wipe All Local Data**.',
        ],
      },
      { type: 'heading', text: 'About' },
      {
        type: 'paragraph',
        text: 'The About screen describes the app’s privacy approach, how it works, and the version. It also includes a voluntary **Buy me a coffee** link. Donations are optional; no features are paywalled.',
      },
    ],
  },
  {
    id: 'app-lock',
    title: 'App Lock',
    summary: 'Protect the app with Face ID, fingerprint, or your device passcode.',
    icon: 'shield-lock-outline',
    color: '#4F46E5',
    blocks: [
      {
        type: 'paragraph',
        text: 'Open **Profile & settings → Preferences → App Lock**.',
      },
      { type: 'heading', text: 'Turn on App Lock' },
      {
        type: 'steps',
        items: [
          'Make sure your device has a screen lock, Face ID, or fingerprint set up.',
          'Turn on **Require device authentication**.',
          'Authenticate with your device security when prompted.',
        ],
      },
      {
        type: 'bullets',
        items: [
          'CashTrack asks for device authentication when it starts.',
          'It locks again after 30 seconds in the background.',
          'It uses Face ID, fingerprint, or your existing device passcode.',
          'CashTrack does not create or store a separate PIN.',
        ],
      },
      { type: 'heading', text: 'Test the lock' },
      {
        type: 'paragraph',
        text: 'When App Lock is on, the **Check it works** card appears. Tap **Lock now** to lock the app immediately.',
      },
      { type: 'heading', text: 'If device security is unavailable' },
      {
        type: 'paragraph',
        text: 'If your device has no screen lock, App Lock cannot be enabled. The app explains that you need to set up device security first. If you remove your device screen lock later, you can turn App Lock off from the lock screen so you are not trapped.',
      },
      { type: 'heading', text: 'Web' },
      {
        type: 'paragraph',
        text: 'App Lock is available in the iOS and Android app only. The web version reports that it is unsupported.',
      },
    ],
  },
  {
    id: 'backup',
    title: 'Backup, Restore, and Data',
    summary: 'Export, back up, restore, replay onboarding, and wipe local data.',
    icon: 'database-sync-outline',
    color: '#059669',
    blocks: [
      {
        type: 'paragraph',
        text: 'CashTrack is local-only. There is no automatic cloud backup. Make a backup before changing phones, uninstalling the app, clearing app data, resetting the device, or making large edits you might want to undo.',
      },
      { type: 'heading', text: 'Export expenses as CSV' },
      {
        type: 'bullets',
        items: [
          'Open **Profile & settings → Data & Privacy → Export CSV Spreadsheet**.',
          'Exports all recorded expenses.',
          'Columns: **Date, Category, Amount, Currency, Memo**.',
          'On the web, the file downloads. On iOS/Android, the share/save sheet opens.',
        ],
      },
      {
        type: 'note',
        text: 'CSV is for spreadsheets and analysis. It does not include income, pots, debts, bills, notes, or settings. Use a full backup for those.',
      },
      { type: 'heading', text: 'Create a full backup' },
      {
        type: 'paragraph',
        text: 'Open **Profile & settings → Data & Privacy → Back Up All Data**. The backup is a JSON file named like CashTrack_Backup_YYYY-MM-DD.json.',
      },
      {
        type: 'bullets',
        items: [
          'Expenses, income, budgets, and preferences.',
          'Profile settings, notes, and settings.',
          'Debts and payments.',
          'Pots, goals, and contributions.',
          'Bills and reminders, including recurring skip records.',
          'Photos and receipts, where available.',
        ],
      },
      {
        type: 'note',
        text: 'Backup files are plain JSON and are not encrypted or password-protected. Treat them like sensitive financial documents.',
      },
      { type: 'heading', text: 'Restore a backup' },
      {
        type: 'steps',
        items: [
          'Open **Profile & settings → Data & Privacy → Restore From Backup**.',
          'Choose a CashTrack backup file.',
          'Review the preview: expenses, income, debts, pots, bills, and notes.',
          'Tap **Replace All Data** to confirm.',
        ],
      },
      {
        type: 'note',
        text: 'Restore replaces everything currently on the device with the backup and cannot be undone. Restore is available in the iOS and Android app only. If a restore fails partway through, your previous data may be incomplete. Keep a recent backup and try again.',
      },
      { type: 'heading', text: 'Replay the walkthrough' },
      {
        type: 'paragraph',
        text: 'Open **Profile & settings → Data & Privacy → Replay App Walkthrough**. This opens the onboarding tour again. It does not delete your data.',
      },
      { type: 'heading', text: 'Wipe all local data' },
      {
        type: 'steps',
        items: [
          'Open **Profile & settings → Data & Privacy → Danger Zone → Wipe All Local Data**.',
          'Confirm **Reset All Local Data?**',
          'Confirm **Final Confirmation** and tap **Wipe Everything**.',
        ],
      },
      {
        type: 'note',
        text: 'This permanently deletes all transactions, notes, goals, debts, and settings, and resets the app to defaults. It cannot be undone. Make a backup first if you might need the data.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Bill reminders, budget alerts, daily messages, and alarm behavior.',
    icon: 'bell-ring-outline',
    color: '#F59E0B',
    blocks: [
      {
        type: 'paragraph',
        text: 'Notifications are available on iOS and Android. The web version does not send notifications.',
      },
      { type: 'heading', text: 'Bill reminders' },
      {
        type: 'paragraph',
        text: 'When **Bill Reminders** is enabled and notifications are allowed, CashTrack schedules:',
      },
      {
        type: 'bullets',
        items: [
          'A reminder **3 days before** the due date at 9:00 AM.',
          'A reminder **1 day before** the due date at 9:00 AM.',
          'A reminder **on the due date** at 9:00 AM.',
          'If **High-Priority Alarm Mode** is on and an exact alarm time is set, the due-date notification uses that time instead.',
        ],
      },
      { type: 'heading', text: 'Budget alerts' },
      {
        type: 'paragraph',
        text: 'When **Budget Caps** is enabled and notifications are allowed, CashTrack can alert you at 80%, 100%, and over-limit.',
      },
      { type: 'heading', text: 'Daily check-in and motivation' },
      {
        type: 'paragraph',
        text: 'When enabled, CashTrack sends a **Daily Check-in** reminder to review your money and a **Daily Motivation** financial quote notification.',
      },
      { type: 'heading', text: 'Test alarm' },
      {
        type: 'bullets',
        items: [
          'Open **Profile & settings → Alerts → Test Alarm Sound**.',
          'CashTrack schedules a test notification after 5 seconds.',
          'Turn off Silent mode to hear it.',
          'On Android, the high-priority alarm channel uses maximum importance and vibration.',
          'If notifications are off, the test does not schedule.',
        ],
      },
      { type: 'heading', text: 'Notification limitations' },
      {
        type: 'bullets',
        items: [
          'CashTrack uses the system notification sound. It does not include a custom ringtone.',
          'It cannot loop like a phone alarm.',
          'Silent mode, Do Not Disturb, and device battery restrictions can block sound or delivery.',
          'In Expo Go, notification behavior may differ from a standalone build. Use a development or production build to test alarms reliably.',
          'Android exact alarms may require the **SCHEDULE_EXACT_ALARM** permission and appropriate device settings.',
        ],
      },
      { type: 'heading', text: 'Managing permissions' },
      {
        type: 'steps',
        items: [
          'Open your device settings.',
          'Find CashTrack.',
          'Allow notifications, sound, and alarms.',
          'Check Silent mode and Do Not Disturb.',
          'Return to **Profile & settings → Alerts** and use **Test Alarm Sound**.',
        ],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and Security',
    summary: 'What stays on your device, network features, and security habits.',
    icon: 'shield-check-outline',
    color: '#0B7252',
    blocks: [
      { type: 'heading', text: 'What stays on your device' },
      {
        type: 'bullets',
        items: [
          'Expenses, income, and budgets.',
          'Pots and contributions.',
          'Debts and payments.',
          'Bills and reminders.',
          'Notes.',
          'Profile details and photos.',
          'Settings.',
        ],
      },
      {
        type: 'paragraph',
        text: 'CashTrack does not create an account and does not upload your financial records to a CashTrack server.',
      },
      { type: 'heading', text: 'Network features' },
      {
        type: 'paragraph',
        text: 'These features may use the internet: live weather, currency exchange rates, and opening external links such as the donation page. They do not upload your expense ledger.',
      },
      { type: 'heading', text: 'Device security' },
      {
        type: 'bullets',
        items: [
          'Use a device screen lock and enable **App Lock** for extra protection.',
          'Keep your device OS and the app updated.',
          'Be careful where you save backup files.',
          'Backup files are not encrypted.',
        ],
      },
      { type: 'heading', text: 'Ads and trackers' },
      {
        type: 'paragraph',
        text: 'The About screen states that CashTrack contains no ads, analytics trackers, or third-party marketing SDKs.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting and FAQ',
    summary: 'Fixes for weather, rates, notifications, backups, reports, and more.',
    icon: 'help-circle-outline',
    color: '#5077C8',
    blocks: [
      { type: 'heading', text: 'The app shows sample weather' },
      {
        type: 'paragraph',
        text: 'Live weather needs location permission and a network connection. Allow location access, pull down on the Weather screen to retry, and if weather still fails, sample data is shown with an offline banner.',
      },
      { type: 'heading', text: 'Currency rates look old or say offline' },
      {
        type: 'paragraph',
        text: 'The converter uses live rates when available and falls back to cached or offline rates. Check your internet connection, reopen the converter, and use the refresh action if shown.',
      },
      { type: 'heading', text: 'Notifications are not arriving' },
      {
        type: 'bullets',
        items: [
          'Allow notifications for CashTrack in device settings.',
          'Turn off Silent mode and Do Not Disturb.',
          'Use **Test Alarm Sound** in Profile → Alerts.',
          'Test in a development or production build rather than Expo Go.',
          'On Android, check exact-alarm permission and battery optimization.',
        ],
      },
      { type: 'heading', text: 'I cannot restore a backup on the web' },
      {
        type: 'paragraph',
        text: 'Restore is available in the iOS and Android app only. Open the same backup file in the native app.',
      },
      { type: 'heading', text: 'I cannot enable App Lock' },
      {
        type: 'paragraph',
        text: 'Your device needs a screen lock, Face ID, or fingerprint. Set up device security first. App Lock is not available on the web.',
      },
      { type: 'heading', text: 'My PDF opened a print dialog instead of downloading' },
      {
        type: 'paragraph',
        text: 'On the web, CashTrack opens a print-ready tab. Choose **Save as PDF** in the browser print dialog.',
      },
      { type: 'heading', text: 'My CSV did not download on mobile' },
      {
        type: 'paragraph',
        text: 'On iOS/Android, the CSV opens the system share sheet. Choose **Save to Files**, **Download**, or your preferred destination.',
      },
      { type: 'heading', text: 'My recurring expense or income did not appear' },
      {
        type: 'paragraph',
        text: 'Recurring entries are generated when their due period is reached and the app is opened. Check the original entry’s start date and frequency.',
      },
      { type: 'heading', text: 'My budget cap is still there next month' },
      {
        type: 'paragraph',
        text: 'This is expected. Budget caps are saved per category and reused each month until you change or remove them.',
      },
      { type: 'heading', text: 'The bill calendar starts on Sunday' },
      {
        type: 'paragraph',
        text: 'This is expected. The bill calendar is always Sunday-first, even if **First Day of Week** is set to Monday.',
      },
      { type: 'heading', text: 'I cannot find an expense' },
      {
        type: 'bullets',
        items: [
          'Clear the search box.',
          'Set the category filter to **All**.',
          'Check the date grouping.',
          'Check whether the expense was deleted.',
          'If you restored a backup, confirm the restore completed.',
        ],
      },
      { type: 'heading', text: 'I deleted something by mistake' },
      {
        type: 'paragraph',
        text: 'Most deletions cannot be undone. Restore a backup if you have one. This is why regular backups are recommended.',
      },
      { type: 'heading', text: 'The app feels slow with many records' },
      {
        type: 'bullets',
        items: [
          'Close and reopen the app.',
          'Keep the app updated.',
          'Use search and category filters instead of scrolling long lists.',
          'On older devices, large receipt photos can increase backup size.',
        ],
      },
      { type: 'heading', text: 'I changed my phone. How do I move my data?' },
      {
        type: 'steps',
        items: [
          'On the old phone, create a full backup.',
          'Save the JSON file somewhere you can access from the new phone.',
          'Install CashTrack on the new phone.',
          'Use **Restore From Backup**.',
          'Confirm **Replace All Data**.',
        ],
      },
    ],
  },
  {
    id: 'limitations',
    title: 'Current Limitations',
    summary: 'Known behaviors in CashTrack 1.0.0 so you can plan around them.',
    icon: 'alert-circle-outline',
    color: '#C8252C',
    blocks: [
      {
        type: 'bullets',
        items: [
          '**Branding** — most of the app uses CashTrack. The About screen and logo use Spendly. They are the same app.',
          '**Budget caps are not month-specific** — a category cap is a single persistent monthly limit. Setting a new cap replaces the old one for all future months.',
          '**Receipt attachment UI is missing** — receipt photos can be stored and displayed, but the add/edit screens do not provide a button to attach, replace, or remove one.',
          '**Bill calendar is Sunday-first** — it ignores the **First Day of Week** preference.',
          '**Period report exports are limited** — daily reports are PDF only, monthly reports are PDF and CSV, and weekly/yearly reports are on-screen only.',
          '**App Lock has no separate PIN** — it relies entirely on the device’s screen lock, Face ID, fingerprint, or passcode.',
          '**Restore is native-only** — restore from backup is not available on the web. Backups can still be created and exported on the web.',
          '**Restore is not transactional** — if a restore fails partway through, the device may be left with incomplete data.',
          '**Notification sound is system-controlled** — CashTrack does not include a custom ringtone and cannot loop a notification like a phone alarm.',
          '**Web limitations** — the web version does not support App Lock, restore, or notifications.',
          '**Stopwatch state is not persistent** — the stopwatch resets when the app is reloaded.',
          '**Currency changes do not convert amounts** — changing the country or currency changes the display label only.',
          '**Recurring entries have no end date** — recurring expenses and income repeat until you delete the original entry.',
          '**Debt settlement does not create a ledger entry** — partial payments and full settlement are tracked on the debt itself.',
          '**Pot contributions are not expenses** — contributions do not automatically reduce your main balance or appear in the expense ledger.',
        ],
      },
    ],
  },
  {
    id: 'quick-reference',
    title: 'Quick Reference',
    summary: 'Common tasks, where things live, defaults, and a data safety checklist.',
    icon: 'book-open-page-variant-outline',
    color: '#0152F5',
    blocks: [
      { type: 'heading', text: 'Common tasks' },
      {
        type: 'table',
        headers: ['Task', 'Where to go'],
        rows: [
          ['Add an expense', 'Center + → Add Expense'],
          ['Add income', 'Center + → Add Income'],
          ['Add a bill', 'Center + → Add Bill / Reminder'],
          ['Add a debt', 'Center + → Add Debt / Loan'],
          ['Create a pot', 'Center + → New Savings Pot'],
          ['Set a budget cap', 'Menu Hub → Budget Caps & Limits'],
          ['View reports', 'Analytics tab'],
          ['Export monthly PDF/CSV', 'Analytics → Export & Downloads'],
          ['Export all expenses as CSV', 'Profile & settings → Data & Privacy'],
          ['Back up everything', 'Profile & settings → Data & Privacy → Back Up All Data'],
          ['Restore a backup', 'Profile & settings → Data & Privacy → Restore From Backup'],
          ['Change theme', 'Menu Hub moon/sun button or Profile → Preferences'],
          ['Change currency', 'Menu Hub → Country & Currency'],
          ['Enable App Lock', 'Profile → Preferences → App Lock'],
          ['Test notifications', 'Profile → Alerts → Test Alarm Sound'],
          ['Replay onboarding', 'Profile → Data & Privacy → Replay App Walkthrough'],
          ['Open the user manual', 'Menu Hub → User Manual & Help or Profile → Data & Privacy → User Manual'],
          ['Wipe all data', 'Profile → Data & Privacy → Danger Zone'],
        ],
      },
      { type: 'heading', text: 'Where things live' },
      {
        type: 'table',
        headers: ['Area', 'Screen'],
        rows: [
          ['Home overview', 'Home tab'],
          ['Expense ledger', 'Expenses tab'],
          ['Monthly analytics', 'Analytics tab'],
          ['All tools and settings', 'Menu tab'],
          ['Income', 'Menu Hub → Income Streams'],
          ['Budgets', 'Menu Hub → Budget Caps & Limits'],
          ['Spending advisor', 'Menu Hub → Spending Advisor'],
          ['Pots and goals', 'Menu Hub → Savings Goals & Pots'],
          ['Debts', 'Menu Hub → Debts & IOUs'],
          ['Bills', 'Menu Hub → Bills & Reminders'],
          ['Bill calendar', 'Menu Hub → Bill & Renewal Calendar'],
          ['Subscriptions', 'Menu Hub → Subscriptions & Recurring Hub'],
          ['Categories', 'Menu Hub → Categories Manager'],
          ['Notes', 'Menu Hub → Keep Notes'],
          ['Calculator', 'Menu Hub → Quick Calculator'],
          ['Stopwatch', 'Menu Hub → Stopwatch & Timer'],
          ['Currency converter', 'Menu Hub → Currency Converter'],
          ['World clocks', 'Menu Hub → World Clocks'],
          ['Weather', 'Home → Weather slide or Menu Hub → Weather & Insights'],
          ['Profile and settings', 'Menu Hub → Profile & Preferences'],
          ['About', 'Profile → Data & Privacy → About CashTrack'],
        ],
      },
      { type: 'heading', text: 'Default values' },
      {
        type: 'table',
        headers: ['Setting', 'Default'],
        rows: [
          ['Theme', 'Auto'],
          ['Temperature unit', '°F'],
          ['First day of week', 'Monday'],
          ['Expense category', 'First available category'],
          ['Recurring frequency', 'Monthly'],
          ['Bill repeat', 'Monthly'],
          ['App Lock', 'Off'],
          ['Home cost card', 'Daily'],
          ['Currency', 'Set by selected country'],
        ],
      },
      { type: 'heading', text: 'Data safety checklist' },
      {
        type: 'bullets',
        items: [
          'I know my selected country and currency.',
          'I have set budget caps for the categories I care about.',
          'I have enabled bill reminders if I want alerts.',
          'I have tested **Test Alarm Sound**.',
          'I have enabled App Lock if I want device authentication.',
          'I have created a recent full backup.',
          'I store backups somewhere safe and private.',
          'I understand that restore replaces all data on the device.',
          'I understand that Wipe All Local Data cannot be undone.',
        ],
      },
    ],
  },
];

function blockText(block: ManualBlock): string {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
    case 'note':
      return block.text;
    case 'bullets':
    case 'steps':
      return block.items.join(' ');
    case 'table':
      return `${block.headers.join(' ')} ${block.rows
        .map(([left, right]) => `${left} ${right}`)
        .join(' ')}`;
  }
}

export function getManualSearchText(section: ManualSection): string {
  return `${section.title} ${section.summary} ${section.blocks
    .map(blockText)
    .join(' ')}`
    .toLowerCase()
    .replace(/\*\*/g, '');
}

export function manualSectionMatches(section: ManualSection, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const searchText = getManualSearchText(section);
  return tokens.every((token) => searchText.includes(token));
}
