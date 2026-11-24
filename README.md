# findMe

findMe is a Nigerian marketplace where people list what they're good at, and anyone who needs help can search for a skill, compare profiles and hire through findMe. All contact goes through the platform, so nobody's email or phone number is shown.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Requires **Node 22.13+**.

### Firebase setup (project `findme-a5c1e`)

findMe stores everything in **Cloud Firestore** (europe-west1) and signs people in with **Firebase Authentication** (email/password).

1. `.env.local` already holds the public web config (`NEXT_PUBLIC_FIREBASE_*`).
2. The server needs Google credentials. Either:
   - **Sign in with gcloud (works even when your organisation blocks key files):** install the Google Cloud CLI (`winget install Google.CloudSDK`), run `gcloud auth application-default login`, and keep `GOOGLE_CLOUD_QUOTA_PROJECT=findme-a5c1e` in `.env.local` (free; it just tells Google which project counts the API usage), or
   - **Use a key file:** Firebase console → ⚙ Project settings → **Service accounts** → **Generate new private key**, saved as `.secrets/firebase-admin.json` (git-ignored; never commit it).

   When deployed on Google Cloud / Firebase App Hosting, credentials are automatic.
3. Load the demo data (creates demo Auth accounts + Firestore documents; safe to re-run):

   ```bash
   npm run seed
   ```

Firestore security rules (`firestore.rules`) deny all direct browser access: every read and write goes through the server with the Admin SDK, so emails and phone numbers never reach a browser unless the app decides to show them. Deploy rule changes with `npx -y firebase-tools@latest deploy --only firestore`.

### Demo accounts (local only)

Every seeded account uses the password `findme-demo-2026`.

| Role | Email |
| --- | --- |
| Designer (pro) | amara@example.com |
| Developer (pro) | tunde@example.com |
| Client | tolu@example.com |


### Optional services

| What | Variables | Without it |
|---|---|---|
| **Email alerts** for requests, messages and reviews: Gmail (free, no domain) or [Resend](https://resend.com) | Gmail: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (a Google app password). Or Resend: `RESEND_API_KEY`, `EMAIL_FROM`. Optional `NEXT_PUBLIC_APP_URL` (defaults to the live Vercel address) | In-app notifications (bell) only |

Email confirmation links are sent by Firebase Authentication and need no setup.

## Features

- **Phone & WhatsApp contact**: pros add a mobile number or business line (validated Nigerian formats, stored as +234…). A number stays hidden (`+234 803 *** **67`) until the pro accepts a request, then both sides get Call and WhatsApp buttons. Businesses can choose to show their line publicly. Numbers are never sent to the browser before they may be shown.
- **Built for Nigeria**: prices are in naira (₦), locations use Nigerian areas and states, times are shown in Lagos time, and search can filter by state. Shared settings live in `src/lib/nigeria.ts`.

- **Landing page**: animated hero search with rotating examples, category grid with live counts, top-rated pros, stats.
- **Smart search** (`/search`): understands everyday phrases ("fix my sink" finds plumbers). Filter by category, price and availability, and sort by match, rating or price.
- **Registration**: a 4-step animated sign-up (role → account → profile → skills) with a password strength meter and suggested skills.
- **Pro profiles** (`/pro/[id]`): skills with levels, services, rating breakdown and reviews, plus a "Hire via findMe" request modal.
- **Dashboard**:
  - Overview with stats and a profile-strength checklist
  - Profile editor with photo upload
  - Skills manager
  - Services manager (create, edit, delete)
  - Requests inbox with Received/Sent tabs
- **Conversations**: private messaging per request. Pros can accept, decline or mark a job complete, and clients can cancel. Clients leave a star review once a job is completed.

## Stack

Next.js 16 (App Router, Cache Components, Server Actions), React 19, Tailwind CSS 4, Motion, lucide-react, **Firebase Authentication** and **Cloud Firestore** (Admin SDK on the server). The browser signs in with Firebase, then swaps its ID token for a 14-day httpOnly **session cookie**; sign-out revokes it. Passwords are handled entirely by Firebase (reset emails included).

Search reads a cached provider catalog (`use cache` + `cacheTag("catalog")`) that refreshes immediately when profiles, services, reviews or jobs change, which keeps Firestore reads low. Ratings, job counts and starting prices are stored as counters updated in transactions.

> Data access lives in `src/lib/queries.ts` (reads) and `src/app/actions.ts` (writes); document shapes are in `src/lib/schema.ts`. For hosting, set `FIREBASE_SERVICE_ACCOUNT` (the key JSON as one line) instead of a file path, or use Firebase App Hosting, which provides credentials automatically.

> **Optional NIN checks ("ID verified" badge, search boost for pros).** Create an account at dojah.io and set `DOJAH_APP_ID`, `DOJAH_SECRET_KEY` and `NIN_HASH_SECRET` (any long random string; never change it once set). For testing, also set `DOJAH_BASE_URL=https://sandbox.dojah.io` with the sandbox keys, and use the test NIN `70123456789`. The full NIN is never stored (see `src/lib/nin.ts`).
