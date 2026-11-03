# CashTrack

CashTrack is a local-first personal finance app for tracking day-to-day spending,
monthly category budgets, recurring expenses, and money you owe or are owed.
Everything is stored on the device, so there is no account, backend, or analytics
pipeline involved in normal use.

## Why CashTrack

- Track expenses by category, date, and amount
- Set monthly budgets and get warnings as you approach a spending limit
- Monitor recurring bills and expenses
- Track debts and loans between people
- Export a selected month as PDF or CSV
- Keep all financial data private and local to the device

## Tech stack

- Expo SDK 58 with Expo Router
- React Native 0.88 and React 19.3
- TypeScript in strict mode
- AsyncStorage for expenses, preferences, debts, notes, to-dos and recurring skips
- expo-sqlite for income, goals, contributions, reminders and payments
- expo-notifications for local reminders
- expo-print, expo-sharing, and expo-file-system for reports, backups and exports
- expo-local-authentication for the optional App Lock

## Requirements

- Node.js 24 or newer (CI uses Node 24)
- npm
- Expo Go for UI work, or a development build for native modules

## Getting started

```bash
npm install
npm start
```

Then either:

- open the Expo dev server in Expo Go on your phone, or
- run an emulator with `a` for Android or `i` for iOS

For native features such as SQLite-backed data access, App Lock biometrics and
notifications, use a development build:

```bash
npx expo run:android
# or
npx expo run:ios
```

Install Expo packages with `npx expo install <package>` so the version matches
the SDK instead of adding it with plain npm.

## Common commands

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npx expo start --web` | Launch the app in a web browser |
| `npm run android` | Run the Android app in a development build |
| `npm run ios` | Run the iOS app in a development build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run the test suite |
| `npx expo-doctor` | Check dependencies and app configuration |
| `npm run check:contrast` | Verify theme colors meet WCAG AA contrast |
| `npm run check:a11y` | Scan components for touch-target and label issues |

## Project structure

```text
src/
  app/          screens and routes (Expo Router)
  components/   shared UI components and design-system primitives
  constants/    theme tokens, categories, and locale metadata
  context/      app state providers for expenses and debts
  data/         static or imported data sources
  hooks/        reusable custom hooks
  storage/      persistence, validation, and local data access
  utils/        formatting, notifications, exports, and budgeting helpers
scripts/        verification scripts for contrast and accessibility
tests/          unit tests for logic-heavy modules
```

## Data privacy

CashTrack stores data locally on the device. It is intentionally designed without
user accounts, cloud sync, or remote analytics so your spending history and debt
records remain under your control.

## Building with EAS

The project is ready for [Expo EAS Build](https://docs.expo.dev/eas/build/introduction/):

```bash
npx eas-cli@latest build --profile development
npx eas-cli@latest build --profile production
```

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
