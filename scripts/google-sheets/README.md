# Stay in touch: Google Sheets setup

The app's optional "Stay in touch" sign-up sends name, email, optional phone,
the updates choice, country, platform and app version to a Google Sheet.
Money records are never sent.

Setup takes about 5 minutes.

## 1. Create the sheet and the script

1. Create a new Google Sheet, for example "CashTrack sign-ups".
2. Open **Extensions → Apps Script**.
3. Delete the sample code and paste all of `signup-collector.gs`.
4. Replace `PASTE-THE-SAME-LONG-RANDOM-STRING-AS-IN-THE-APP` with a long random
   string (32+ characters). Keep it; the app needs the same value.
5. Save (Ctrl+S).

## 2. Deploy it as a web app

1. **Deploy → New deployment**, type **Web app**.
2. **Execute as:** Me. **Who has access:** Anyone.
3. Click **Deploy** and allow access when Google asks.
4. Copy the **Web app URL** (it ends in `/exec`).
5. Open that URL in a browser. You should see
   `{"ok":true,"message":"CashTrack sign-up collector is running."}`.

The `Signups` tab is created automatically on the first sign-up.

> When you change the script later, use **Deploy → Manage deployments → Edit →
> Version: New version**. That keeps the same URL. "New deployment" makes a new
> URL, and installed apps would keep posting to the old one.

## 3. Tell the app where to send

Create `.env` in the project root (it is git-ignored), based on `.env.example`:

```
EXPO_PUBLIC_SIGNUP_URL=https://script.google.com/macros/s/XXXXXXXX/exec
EXPO_PUBLIC_SIGNUP_KEY=the-same-long-random-string
```

Restart the dev server with a clean cache so the values are picked up:

```
npx expo start --clear
```

For EAS builds, `.env` is not uploaded. Add both variables to EAS instead:

```
npx eas-cli@latest env:create --name EXPO_PUBLIC_SIGNUP_URL --value "https://script.google.com/..." --environment production --environment preview --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_SIGNUP_KEY --value "the-same-long-random-string" --environment production --environment preview --visibility plaintext
```

Until the URL is set, sign-ups are saved on the phone and sent automatically
once a build with the URL is installed. Nothing is lost.

## About the key

`EXPO_PUBLIC_` values are built into the app, so the key only stops casual
spam from people who find the URL. It is not a password. The script also
validates every field, caps lengths, blocks spreadsheet formula injection, and
de-duplicates by install id.

## Withdrawals

When a user taps **Withdraw and delete my details** (Profile & settings → Data
& privacy), the app deletes the details on the phone and the script deletes
that person's row from the sheet.

## Your obligations

Collecting names, emails and phone numbers makes you responsible for them:

- Publish a privacy policy that says what you collect and why, and link it in
  the App Store and Google Play listings.
- Declare "Name", "Email address" and "Phone number" (optional, user-provided)
  in Google Play's Data safety form and Apple's App Privacy section.
- Only email people who ticked "Wants updates".
- Share the sheet with as few people as possible.
