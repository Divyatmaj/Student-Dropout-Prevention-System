# Udaan — Student Retention & Early Intervention Platform

> Identify early. Intervene meaningfully. Keep learning on track.

Udaan helps school staff notice early warning signs (attendance, academic
decline, reported barriers), understand **why** a student was flagged through a
transparent rule-based score, and track human-led interventions to completion.

## Repository layout

```
.
├── client/          Udaan web app (React 18 + Vite)
├── server/          Udaan API (Express 5 + Prisma 7 + PostgreSQL)
├── shared/          Business rules shared by client and server (attendance, risk, interventions)
├── api/             Vercel serverless entry that exposes the Udaan API
├── vercel.json      Single Vercel project: static frontend + /api function
└── package.json     npm workspaces root
```

The Udaan web app and API deploy as **one Vercel project on one domain**:

| Request          | Served by                                         |
| ---------------- | ------------------------------------------------- |
| `/api/v1/*`      | Udaan API running as a Vercel function            |
| everything else  | `client/dist` (React SPA, `index.html` fallback)  |

Because both live on the same origin, the frontend always calls relative
`/api/v1/...` URLs and no CORS configuration is needed in production. During
local development, the Vite dev server proxies `/api` to the local Express
server, so the same code works in both environments.

## Getting started

Requirements: Node.js 20+ and npm 10+.

```bash
npm install                      # installs all workspaces and generates the Prisma client
cp client/.env.example client/.env.local
npm run dev:web                  # Udaan web app on http://localhost:3000
```

With `VITE_USE_MOCKS=true` (the default in `.env.example`) the web app runs
entirely on local mock data, so the API is not required.

### Running the API

The API needs a PostgreSQL database. This project uses [Neon](https://neon.com)
(Lakebase Postgres) and the Neon CLI (`npm i -g neon`).

1. Sign in and link this folder to the Neon project (once):
   `neon login`, then `neon link` (writes the git-ignored `.neon` file).
2. Pull the connection strings: `neon env pull` (or `neon deploy`, which also applies
   `neon.ts`). This writes `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct)
   into the git-ignored `.env.local`, which the API and Prisma read automatically.
3. Create the tables: `npm run db:deploy` (uses the direct connection).
4. Start both apps: `npm run dev` (API on http://localhost:5000, web app on
   http://localhost:3000; the web app proxies `/api` to the API).
5. Check the connection: http://localhost:3000/api/v1/health/db should return
   `"database":"ok"` and the latest migration name.

Without the Neon CLI, copy both connection strings from the Neon console into
`server/.env` (see `server/.env.example`). A local PostgreSQL also works: set only
`DATABASE_URL`.

`neon.ts` declares the Neon services for each branch (only Postgres for now). New
non-default branches expire after 7 days, which suits per-feature branches created with
`neon checkout <name> --create`.

### Scripts (run from the repo root)

| Command              | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Start the API and the web app together                    |
| `npm run dev:web`    | Start only the web app                                    |
| `npm run dev:api`    | Start only the API (restarts on file changes)             |
| `npm run build`      | Generate the Prisma client and build the web app          |
| `npm test`           | Run the unit tests in every workspace                     |
| `npm run db:migrate` | Create a migration after editing `schema.prisma` (dev DB) |
| `npm run db:deploy`  | Apply pending migrations to the database                  |
| `npm run db:status`  | Show which migrations have been applied                   |
| `npm run db:studio`  | Browse the database in Prisma Studio                      |

API tests run without a database. To also run the database tests, point
`TEST_DATABASE_URL` at a disposable database (migrated with `npm run db:deploy`):
`TEST_DATABASE_URL=postgresql://... npm test -w server`.

### API conventions

- Base path `/api/v1`. Successful responses: `{ "success": true, "data": ..., "message"? }`.
- Errors: `{ "success": false, "error": { "code", "message", "details": [{ "field", "message" }] } }`
  with 400 (malformed), 401, 403, 404, 409 (duplicate/conflict), 422 (validation),
  413 (body over 100 kB) and 503 (database unavailable).
- `GET /api/v1/health` checks the API; `GET /api/v1/health/db` checks the database.

## Attendance policy

Udaan calculates attendance the same way in the web app and the API (see
`shared/src/attendance.js`):

- Each student has at most one record per school day: Present, Absent, Late or Excused.
- **Late** counts as attended. **Excused** days are left out of the percentage.
- A day with no record is never treated as an absence.
- Attendance % = (present + late) ÷ (present + late + absent).
- Consecutive absences count the latest *recorded* school days, not calendar days.

## Risk indicator

Udaan's early-warning score (0–100) is a transparent rule table, implemented once in
`shared/src/risk.js` and covered by unit tests:

| Rule | Points |
| --- | --- |
| Attendance below 75% / from 75% to below 85% | +30 / +15 |
| 3–4 / 5+ consecutive absent school days | +15 / +25 |
| Same-subject result drop of 10–19.9 / 20+ percentage points | +10 / +20 |
| Financial barrier reported | +10 |
| Open intervention past its due date | +10 |

Low 0–24, Medium 25–49, High 50+. With fewer than 10 recorded school days or no marks
the score is **provisional**; with no usable data it is **insufficient data** (never
"low"). Every score lists its reasons and must be reviewed by a person. It is a
prioritisation aid for staff — not a prediction, and never grounds for punitive action.

## Interventions

An intervention is a support action for one student with a concern category
(attendance, academic, financial, accessibility, family, other), a priority, an
**owner** and a **due date**. Rules live in `shared/src/interventions.js`:

- Status moves between Open → In progress → Completed or Cancelled. Completing needs a
  written outcome; cancelling or reopening needs a reason.
- An open intervention is **overdue** once its due date has passed (due today is not
  overdue). Overdue interventions add +10 to the student's risk score until resolved.
- The student's risk reasons at the time are saved with the intervention, and every
  change is kept in an append-only history.
- Only the creator, the owner, a principal or a school admin can change an intervention.
- Dashboards show who and when, never the concern text or notes.

## Demo accounts (mock mode)

All use the password `Udaan@123`.

| Email | Role |
| --- | --- |
| `admin@udaan.demo` | School administrator — manages staff |
| `principal@udaan.demo` | Principal |
| `teacher@udaan.demo` | Teacher — dashboard shows assigned students |
| `farhan.khan@udaan.demo` | Teacher |
| `inactive@udaan.demo` | Deactivated — cannot sign in |

## Environment variables

| Variable             | Where   | Purpose                                                        |
| -------------------- | ------- | -------------------------------------------------------------- |
| `VITE_API_BASE_URL`  | client  | API base path (default `/api/v1`)                              |
| `VITE_DEV_API_PROXY` | client  | Local API URL the dev server proxies `/api` to                 |
| `VITE_USE_MOCKS`     | client  | `true` to use local mock data instead of the API               |
| `DATABASE_URL`       | server  | PostgreSQL connection used by the API (Neon: pooled string)    |
| `DATABASE_URL_UNPOOLED` | server | Direct connection used only for migrations (Neon)            |
| `PORT`               | server  | Local API port (default `5000`)                                |
| `CORS_ORIGINS`       | server  | Only if the web app runs on another origin (comma-separated)   |
| `DB_POOL_MAX`        | server  | Connections per API instance (default `5`)                     |

## Deployment (Vercel)

1. Import this repository into Vercel (leave **Root Directory** as the repo root).
2. Vercel reads `vercel.json`: it runs `npm run build`, serves `client/dist`, and
   deploys `api/index.js` (the Express app) as a serverless function for `/api/*`.
3. Add `DATABASE_URL` (Neon pooled string) in **Project → Settings → Environment
   Variables**, and run `npm run db:deploy` from your machine to apply migrations.
   The API registers its connection pool with `attachDatabasePool` from
   `@vercel/functions`, so idle connections are closed cleanly between requests.
   The full production checklist is added in a later step.

## Privacy note

This is a prototype. Use only fictional demo data. Do not load real student or
guardian information without institutional authorization and a privacy review.
