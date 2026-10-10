# Implementation Plan: Subscriptions Hub & Savings Pot Contribution Charts

Implement two high-value features for Spendly:
1. **Dedicated Subscriptions & Recurring Bills Hub**: A dedicated screen (`src/app/subscriptions.tsx`) aggregating all recurring subscriptions and bills with monthly cost totals and renewal alerts.
2. **Visual Contribution Charts for Savings Pots**: A contribution timeline & trend visualization on the goal detail screen (`src/app/goals/[id].tsx`) to track savings velocity.

## User Review Required

> [!NOTE]
> - **Subscriptions Hub**: Accessible via a new route `src/app/subscriptions.tsx` and linked from the Bills & Reminders widget on the home screen.
> - **Contribution Charts**: Added directly to `src/app/goals/[id].tsx` using clean SVG/bar UI elements representing contribution history chronologically.

## Proposed Changes

### Subscriptions & Recurring Bills Hub
#### [NEW] [subscriptions.tsx](file:///C:/xampp/htdocs/ProDo/App/spendly/src/app/subscriptions.tsx)
- Create a dedicated subscriptions screen showing total monthly recurring outflows, active subscriptions list (Netflix, Spotify, Cloud, Gym, etc.), days until renewal, and quick add/pay actions.

#### [MODIFY] [index.tsx](file:///C:/xampp/htdocs/ProDo/App/spendly/src/app/(tabs)/index.tsx)
- Link the Bills & Reminders widget or menu to the new Subscriptions Hub.

### Visual Contribution Charts for Savings Pots
#### [MODIFY] [[id].tsx](file:///C:/xampp/htdocs/ProDo/App/spendly/src/app/goals/[id].tsx)
- Add a visual contribution history timeline / progress chart component showing accumulation milestones over time.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` and `npx expo lint`.
- Run `npm test`.

### Manual Verification
- Verify Subscriptions Hub renders recurring outflows and monthly totals correctly.
- Verify goal detail screen displays the contribution trend chart properly.
