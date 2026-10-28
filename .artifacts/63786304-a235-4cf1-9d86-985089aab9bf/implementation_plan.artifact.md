# Auto-Return to Daily Cost in CostSummaryCarousel

Add an auto-return feature in `CostSummaryCarousel` so that if the user views any non-daily card (Yesterday, Weekly, Monthly, Yearly) for 30 seconds, it automatically snaps back to Daily Cost.

## User Review Required

- **Timer Duration**: 30 seconds of inactivity on a non-daily card before snapping back to Daily Cost.
- **Interaction Reset**: Interacting with the carousel (swiping or tapping dots) resets the 30-second idle timer.

## Proposed Changes

### Dashboard Components

#### [MODIFY] [cost-summary-carousel.tsx](file:///C:/xampp/htdocs/ProDo/App/spendly/src/components/dashboard/cost-summary-carousel.tsx)
- Implement a 30-second auto-return timer when `activeIndex !== DAILY_INDEX`.
- Clear/reset timer on user scroll, tab press, or when returning to Daily Cost (`activeIndex === DAILY_INDEX`).

## Verification Plan

### Automated Tests
- Typecheck (`npx tsc --noEmit`) and lint (`npx expo lint`).

### Manual Verification
- Swipe to Monthly or Weekly cost card, wait 30 seconds, and observe automatic snap-back to Daily Cost.
