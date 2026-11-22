# findIn

findIn is a marketplace where people list what they're good at, and anyone who needs help can search for a skill, compare profiles and hire through findIn. All contact goes through the platform, so nobody's email or phone number is shown.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Requires **Node 22.13+** (it uses the built-in `node:sqlite`).

The database is created automatically at `data/findin.db` and seeded with demo professionals, clients and reviews. Delete the `data/` folder to start fresh.

### Demo accounts (local only)

Every seeded account uses the password `findin-demo-2026`.

| Role | Email |
| --- | --- |
| Designer (pro) | amara@example.com |
| Developer (pro) | daniel@example.com |
| Client | olivia@example.com |

## Features

- **Landing page**: animated hero search with rotating examples, category grid with live counts, top-rated pros, stats.
- **Smart search** (`/search`): understands everyday phrases ("fix my sink" finds plumbers). Filter by category, price and availability, and sort by match, rating or price.
- **Registration**: a 4-step animated sign-up (role → account → profile → skills) with a password strength meter and suggested skills.
- **Pro profiles** (`/pro/[id]`): skills with levels, services, rating breakdown and reviews, plus a "Hire via findIn" request modal.
- **Dashboard**:
  - Overview with stats and a profile-strength checklist
  - Profile editor with photo upload
  - Skills manager
  - Services manager (create, edit, delete)
  - Requests inbox with Received/Sent tabs
- **Conversations**: private messaging per request. Pros can accept, decline or mark a job complete, and clients can cancel. Clients leave a star review once a job is completed.

## Stack

Next.js 16 (App Router, Cache Components, Server Actions), React 19, Tailwind CSS 4, Motion, lucide-react and SQLite via `node:sqlite`. Passwords are hashed with scrypt, and sessions are random tokens in httpOnly cookies.

> Before deploying to a serverless host, swap the SQLite file for a hosted database such as Postgres, because serverless filesystems are ephemeral. All data access lives in `src/lib/db.ts`, `src/lib/queries.ts` and `src/app/actions.ts`.
