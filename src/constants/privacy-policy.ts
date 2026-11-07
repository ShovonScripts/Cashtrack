/**
 * The CashTrack privacy policy. One source for two outputs:
 * - the in-app screen (src/app/privacy.tsx)
 * - the hosted web page (docs/privacy-policy.html, built by
 *   `npm run build:privacy`), whose URL goes into the store listings.
 *
 * Keep this file free of imports so the build script can load it with plain
 * Node. When the app starts collecting anything new, or sends data to a new
 * service, update this file, bump PRIVACY_UPDATED and rebuild the HTML.
 */

export type PolicyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'table'; headers: [string, string, string]; rows: [string, string, string][] };

export type PolicySection = {
  id: string;
  title: string;
  blocks: PolicyBlock[];
};

export const PRIVACY_APP_NAME = 'CashTrack';
/** ISO date the policy last changed. */
export const PRIVACY_UPDATED = '2026-11-07';
/**
 * Public copy of this policy (docs/privacy-policy.html served by GitHub Pages
 * from the /docs folder of main). This URL goes into the store listings, and the
 * sign-up form links to it because it is shown inside a modal.
 */
export const PRIVACY_POLICY_URL = 'https://shovonscripts.github.io/Cashtrack/privacy-policy.html';
/** Where people send privacy questions and deletion requests. */
export const PRIVACY_CONTACT_EMAIL = 'jishovon@gmail.com';

export const PRIVACY_SUMMARY = [
  'Your money records (expenses, income, budgets, bills, debts, goals, notes) stay on your phone. We never receive them.',
  'There are no ads, no analytics and no tracking SDKs.',
  'If you choose to join "Stay in touch", we receive your name, email, optional phone number and country. You can withdraw and delete them in the app at any time.',
];

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    id: 'who',
    title: 'Who we are',
    blocks: [
      {
        type: 'paragraph',
        text: `${PRIVACY_APP_NAME} is a personal expense tracker made by an independent developer ("we", "us"). This policy explains what information the app handles, where it goes and the choices you have. It applies to the ${PRIVACY_APP_NAME} app on Android, iOS and the web.`,
      },
    ],
  },
  {
    id: 'device',
    title: 'Information that stays on your device',
    blocks: [
      {
        type: 'paragraph',
        text: 'Everything you enter to manage your money is stored only on your device, in the app\'s private storage. We do not run a server for it, and we cannot see, read or recover it. This includes:',
      },
      {
        type: 'bullets',
        items: [
          'Expenses, income, categories, budgets and category limits.',
          'Bills, reminders, subscriptions, debts, savings pots and goals.',
          'Notes, to-do items, and receipt or profile photos you attach.',
          'Your profile name, country, currency and app settings.',
          'Your app lock setting. Fingerprint or Face ID is checked by your phone\'s operating system; the app only learns whether the check passed and never receives your biometric data.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Because the data lives only on your device, uninstalling the app or clearing its data deletes it. Use the backup or export option in Profile & settings if you want a copy. A backup file is saved or shared wherever you choose; we never receive it.',
      },
    ],
  },
  {
    id: 'signup',
    title: 'Stay in touch (optional)',
    blocks: [
      {
        type: 'paragraph',
        text: 'During setup, and later in Profile & settings > Data & privacy, you can choose to join our mailing list. This is optional: skipping it changes nothing in the app. If you join, we receive:',
      },
      {
        type: 'bullets',
        items: [
          'Your name and email address.',
          'Your phone number, only if you enter one.',
          'Whether you ticked "Send me product updates and tips".',
          'Your country (from your app settings), the platform (Android, iOS or web) and the app version.',
          'A random install ID created by the app, so a retry or a withdrawal reaches the right entry. It is not linked to your device\'s advertising ID or hardware.',
        ],
      },
      {
        type: 'paragraph',
        text: 'We use this to contact you about CashTrack: new features, important changes and, if you ticked the box, tips and product updates. We do not sell it, rent it or share it with advertisers.',
      },
      {
        type: 'paragraph',
        text: 'These details are stored in a private Google Sheet owned by the developer, received through Google Apps Script. Google hosts that data under its own terms and privacy policy (https://policies.google.com/privacy).',
      },
    ],
  },
  {
    id: 'services',
    title: 'Online services the app uses',
    blocks: [
      {
        type: 'paragraph',
        text: 'Some features fetch public information from other services. When they do, that service sees your IP address, as with any internet request. None of them receive your money records.',
      },
      {
        type: 'table',
        headers: ['Feature', 'Service', 'What is sent'],
        rows: [
          ['Weather', 'Open-Meteo (open-meteo.com)', 'Your approximate location (latitude and longitude), only while you use the weather feature'],
          ['City name for weather', 'Your phone\'s geocoder, or BigDataCloud (bigdatacloud.com) as a fallback', 'The same location coordinates'],
          ['Currency converter', 'ExchangeRate-API (open.er-api.com)', 'Nothing about you; it downloads public rates'],
          ['World clock photos', 'Wikimedia (wikimedia.org)', 'Nothing about you; it downloads public images'],
          ['Weather background photos', 'Unsplash (unsplash.com)', 'Nothing about you; it downloads public images'],
          ['Photo of your area (World Clocks)', 'Wikipedia (wikipedia.org)', 'The name of your city or time-zone city, only when it is not one of the built-in cities, to find its photo'],
          ['Stay in touch', 'Google Apps Script and Google Sheets', 'The sign-up details listed above, only if you join'],
        ],
      },
    ],
  },
  {
    id: 'permissions',
    title: 'Permissions',
    blocks: [
      {
        type: 'bullets',
        items: [
          'Location: asked for only to show local weather, and to name your area on the World Clocks page when you tap Find my area. Your location is not stored, on your device or by us. You can deny it and the rest of the app works; World Clocks then uses your time zone.',
          'Photos: to choose a profile or cover picture, or attach a receipt. Chosen photos stay on your device.',
          'Notifications and exact alarms: to remind you about bills and timers. Reminders are scheduled on your device; we do not send push messages.',
          'Biometrics: to unlock the app with your fingerprint or face, if you turn on app lock.',
        ],
      },
    ],
  },
  {
    id: 'not',
    title: 'What we do not do',
    blocks: [
      {
        type: 'bullets',
        items: [
          'No ads or advertising IDs.',
          'No analytics, crash reporting or tracking SDKs.',
          'No bank logins and no access to your bank accounts.',
          'No selling or sharing of personal information.',
          'No tracking across other apps or websites.',
        ],
      },
    ],
  },
  {
    id: 'retention',
    title: 'How long we keep your information',
    blocks: [
      {
        type: 'paragraph',
        text: 'On-device data stays until you delete it or uninstall the app. Stay-in-touch details stay until you withdraw. Withdrawing deletes your entry from the sheet; it is not just marked inactive.',
      },
    ],
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    blocks: [
      {
        type: 'bullets',
        items: [
          'Withdraw from Stay in touch in Profile & settings > Data & privacy. This deletes your details from our sheet. If you are offline, the app sends the request the next time you are online.',
          'Ask for a copy of the sign-up details we hold, or ask us to correct or delete them, by emailing us. This also works if you no longer have the app.',
          'Delete all on-device data with "Reset All Local Data" in Profile & settings, or by uninstalling the app.',
          'Depending on where you live (for example under the GDPR in the EU and UK), you may also have the right to object to or restrict how we use your data, and to complain to your local data protection authority.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Our legal basis for using sign-up details is your consent, which you can withdraw at any time.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    blocks: [
      {
        type: 'paragraph',
        text: 'Sign-up details are sent over an encrypted HTTPS connection. On your device, data sits in the app\'s private storage, protected by your phone\'s own security, and you can add app lock. Android cloud backup is turned off for the app, so your records are not copied to Google Drive automatically. No method is perfectly secure, but we keep what we collect to a minimum.',
      },
    ],
  },
  {
    id: 'children',
    title: 'Children',
    blocks: [
      {
        type: 'paragraph',
        text: 'CashTrack is not directed at children under 13, and we do not knowingly collect their personal information. If you believe a child has joined Stay in touch, email us and we will delete the entry.',
      },
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    blocks: [
      {
        type: 'paragraph',
        text: 'If we change what the app collects, we will update this policy and the "Last updated" date. For important changes, we will also tell you in the app.',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    blocks: [
      {
        type: 'paragraph',
        text: `Questions, or a request to see or delete your data: ${PRIVACY_CONTACT_EMAIL}`,
      },
    ],
  },
];

/** "6 November 2026" from an ISO date, without depending on the device locale. */
export function formatPolicyDate(iso: string): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}
