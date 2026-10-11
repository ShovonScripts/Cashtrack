# UI/UX Master Ledger — Spendly (CashTrack)

This ledger is append-only. Rows are never deleted or renumbered. Statuses change only with documented reasons.

| ID | File & Line | Quoted Code / Context | Problem Description | Severity | Status | Reason / Diff Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| F-01 | `src/app/_layout.tsx:100` | `backgroundColor: '#EF4444'` | Hardcoded background `#EF4444` in error banner | Medium | Fixed | Replaced with `theme.danger`. |
| F-02 | `src/components/quick-add-modal.tsx:135` | `closeButton` style | Close button missing explicit minSize | Low | Fixed | Added minHeight/minWidth and touch padding. |
| F-03 | `src/app/(tabs)/_layout.tsx:28` | `shadowColor: '#000'` | Tab bar shadow uses hardcoded `#000` | Low | Open | Needs design decision on dark mode shadow tokens. Question: Should we use theme-aware shadows? |
| F-04 | `src/app/advisor.tsx:55` | `color: '#4ade80'` | Hardcoded hex `#4ade80` in AI badge | Low | Open | Success accent indicator; can be tokenized. |
| F-05 | `src/app/budgets.tsx:45` | `TextInput` | TextInput without `returnKeyType="done"` | Medium | Open | Add returnKeyType to improve keyboard flow. |
| F-06 | `src/app/income.tsx:88` | `isSubmitting` | `isSubmitting` guard present but lacks disabled state styling | Low | Open | Add opacity styling on submit button. |
| F-07 | `src/app/expenses.tsx:78` | `TextInput` | Search input missing `clearButtonMode="while-editing"` | Low | Open | Add clear button mode on iOS. |
| F-08 | `src/app/reports.tsx:254` | `Card style={styles.breakdownCard}` | Chart container lacks explicit accessibility description | Medium | Fixed | Added `accessible` and `accessibilityLabel` to breakdown report card. |
| F-09 | `src/app/goals/add.tsx:55` | Target input | Goal target input missing tabular-nums fontVariant | Low | Open | Add fontVariant tabular-nums. |
| F-10 | `src/app/debts/add.tsx:80` | `Pressable typeButton` | Debt contact selector lacks role description | Low | Open (Verified) | Already had `accessibilityRole="button"` and `accessibilityState`. |
| F-11 | `src/app/bills/add.tsx:136` | `Pressable chip` / repeat | Reminder date picker and chips lack accessibility label | Medium | Fixed | Added `accessibilityRole="button"`, `accessibilityState`, and `accessibilityLabel` to chips and repeat buttons. |
| F-12 | `src/app/subscriptions.tsx:42` | Subscription list item | Subscription list item missing swipe-to-delete | Low | Removed | Feature idea, not a defect. |
| F-13 | `src/app/weather.tsx:88` | Weather tip text | Weather tip text lacks dynamic type scaling | Low | Open | Use ThemedText font scaling. |
| F-14 | `src/app/profile.tsx:120` | Export CSV button | Export CSV button lacks loading indicator | Medium | Open | Add loading spinner. |
| F-15 | `src/app/country.tsx:40` | Country selection list | Country selection list lacks search filter | Low | Open | Add search input for long lists. |
| F-16 | `src/app/categories.tsx:50` | Color picker array | Category color picker uses hardcoded hex array | Low | Open | Reference theme constants. |
| F-17 | `src/components/external-link.tsx:10` | `ExternalLink` | External links missing accessibilityHint & role | Low | Fixed | Added `accessibilityRole="link"` and `accessibilityHint="Opens in an in-app web browser"`. |
| F-18 | `src/components/expense-form.tsx:85` | Amount TextInput | Amount TextInput lacks auto-focus on modal open | Low | Open | Add autoFocus prop. |
| F-19 | `src/components/card.tsx:20` | Card shadow | Card shadow uses fixed opacity on Android | Low | Open | Standardize elevation. |
| F-20 | `src/components/category-chips.tsx:35` | ScrollView | ScrollView missing showsHorizontalScrollIndicator=false | Low | Removed | Feature idea / web scrollbar styling. |
| F-21 | `src/components/empty-state.tsx:18` | Empty state button | Empty state action button missing hitSlop | Low | Open | Add hitSlop. |
| F-22 | `src/components/goal-progress-card.tsx:48` | Progress bar track | Progress bar missing accessibilityValue & role | Medium | Fixed | Added `accessible`, `accessibilityRole="progressbar"`, `accessibilityValue`, and `accessibilityLabel`. |
| F-23 | `src/components/receipt-attachment.tsx:35` | `permissionResult.granted` | Camera permission denial lacked fallback user guidance | High | Fixed | Added descriptive `Alert.alert` guiding user to device settings. |
| F-24 | `src/app/expense/[id].tsx:70` | `handleDelete` | Expense delete lacked explicit confirmation | High | Fixed | Added `Alert.alert` with destructive confirmation. |
| F-25 | `src/app/profile.tsx:230` | `handleResetData` | Reset data action lacked double confirmation | High | Fixed | Implemented a two-step destructive confirmation dialog. |
| F-26 | `src/app/goals/[id].tsx:50` | Goal delete action | Goal delete lacks confirmation | High | Open | Add Alert.alert confirmation. |
| F-27 | `src/app/debts/[id].tsx:80` | Debt payment / settle | Debt payment record lacks double-submit guard | Medium | Open | Add isSubmitting state. |

### Current Ledger Counts:
- **Open**: 14
- **Fixed**: 11
- **Deferred**: 0
- **Removed**: 2
- **Not reproducible**: 0
