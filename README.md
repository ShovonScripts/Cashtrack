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

- Expo SDK 57 with Expo Router
- React Native 0.86 and React 19
- TypeScript in strict mode
- AsyncStorage for expenses, preferences, debts, notes and to-dos
- expo-sqlite for income, goals and bill reminders (AsyncStorage on web)
- expo-notifications for local reminders
- expo-print, expo-sharing, and expo-file-system for reports and exports

## Requirements

- Node.js with the current LTS version recommended
- npm
- A mobile simulator or Expo Go for local development

## Getting started

```bash
npm install
npm start
```

Then either:

- open the Expo dev server in Expo Go on your phone, or
- run an emulator with `a` for Android or `i` for iOS

For native features such as SQLite-backed data access, use a development build:

```bash
npx expo run:android
# or
npx expo run:ios
```

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
tests/          unit tests for logic-heavy modules
```

## Data privacy

CashTrack stores data locally on the device. It is intentionally designed without
user accounts, cloud sync, or remote analytics so your spending history and debt
records remain under your control.

## Building with EAS

The project is ready for [Expo EAS Build](https://docs.expo.dev/eas/build/introduction/):

```bash
npx eas-cli build --profile development
npx eas-cli build --profile production
```

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
