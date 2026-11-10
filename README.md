# Udaan — Student Retention & Early Intervention Platform

> Identify early. Intervene meaningfully. Keep learning on track.

Udaan helps school staff notice early warning signs (attendance, academic
decline, reported barriers), understand **why** a student was flagged through a
transparent rule-based score, and track human-led interventions to completion.

**Live demo:** https://student-dropout-prevention-system.vercel.app/login — sign in with
any [demo account](#demo-accounts) (password `Udaan@123`). The demo database is shared,
so other visitors may have changed its records.

## Features

- **Students** — searchable register with enrolment status, guardian contact, support
  notes and an assigned class teacher; students are never deleted.
- **Attendance** — daily class register, corrections with who-recorded-what, an
  audited delete, and a school overview with class rates.
- **Academics** — assessments per class and marks sheets checked against the maximum;
  same-subject drops are highlighted.
- **Risk indicator** — a transparent 0–100 rule-based score with its reasons, data
  completeness, and a human review step.
- **Interventions** — owned, time-bound support actions with outcomes, overdue tracking
  and full history.
- **Family meetings** — date-stamped parent or guardian meeting notes, attendees and agreed
  follow-up actions on the student profile.
- **Dashboard** — live school-wide (or a teacher's own) figures and follow-ups.
- **Staff and roles** — school admin, principal and teacher, with teachers limited to
  their assigned students; every school's data is kept separate.

Built with React 18 + Vite, Express 5, Prisma 7 and PostgreSQL (Neon), deployed as one
Vercel project. Business rules live once in `shared/` and are used by both the web app
and the API.

## Repository layout

```
.
├── client/          Udaan web app (React 18 + Vite)
├── server/          Udaan API (Express 5 + Prisma 7 + PostgreSQL)
├── shared/          Business rules shared by client and server (attendance, risk, interventions)
├── api/             Vercel serverless entry that exposes the Udaan API
├── vercel.json      Single Vercel project: static frontend + /api function
├── neon.ts          Neon branch configuration (Postgres only)
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
```

The web app talks to the Udaan API, so set up the database and API below, then run
`npm run dev`. For frontend-only work without a database, set `VITE_USE_MOCKS=true` in
`client/.env.local`: the web app then runs on built-in demo data (changes are kept in
memory until the page is reloaded).

### Running the API

The API needs a PostgreSQL database. This project uses [Neon](https://neon.com)
(Lakebase Postgres) and the Neon CLI (`npm i -g neon`).

1. Sign in and link this folder to the Neon project (once):
   `neon login`, then `neon link` (writes the git-ignored `.neon` file).
2. Pull the connection strings: `neon env pull` (or `neon deploy`, which also applies
   `neon.ts`). This writes `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct)
   into the git-ignored `.env.local`, which the API and Prisma read automatically.
3. Create the tables: `npm run db:deploy` (uses the direct connection).
4. Set a token-signing secret in `server/.env` (git-ignored):
   `echo "JWT_SECRET=\"$(openssl rand -base64 48)\"" > server/.env`
5. Add the demo school, staff, students, attendance, assessments, marks and
   interventions: `npm run db:seed` (safe to re-run; it only adds what is missing).
6. Start both apps: `npm run dev` (API on http://localhost:5000, web app on
   http://localhost:3000; the web app proxies `/api` to the API).
7. Check the connection: http://localhost:3000/api/v1/health/db should return
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
| `npm run db:seed`    | Add the demo school, staff, records and interventions     |
| `npm run db:studio`  | Browse the database in Prisma Studio                      |

API tests run without a database. To also run the database tests, point
`TEST_DATABASE_URL` at a disposable database whose name contains `test` (the tests
empty it first), migrated with `npm run db:deploy`:
`TEST_DATABASE_URL=postgresql://.../udaan_test npm test -w server`.

### API conventions

- Base path `/api/v1`. Successful responses: `{ "success": true, "data": ..., "message"? }`.
- Errors: `{ "success": false, "error": { "code", "message", "details": [{ "field", "message" }] } }`
  with 400 (malformed), 401, 403, 404, 409 (duplicate/conflict), 422 (validation),
  413 (body over 100 kB) and 503 (database unavailable).
- `GET /api/v1/health` checks the API; `GET /api/v1/health/db` checks the database.

### Sign-in and access

- `POST /api/v1/auth/login` returns a signed JWT (8 hours by default) and the user;
  send it as `Authorization: Bearer <token>`. `GET /api/v1/auth/me` returns the
  current user.
- Passwords are stored only as bcrypt hashes. A wrong password, an unknown email and a
  deactivated account all get the same `401 Invalid email or password`, and failed
  attempts are limited to 10 per email and IP in 15 minutes (`429`).
- Every request reloads the user, so deactivating an account or changing a role takes
  effect immediately.
- Roles: **school administrator** (everything, including staff accounts), **principal**
  (school-wide view, enrolment, cannot manage staff), **teacher** (attendance, marks,
  interventions). The same permission table (`shared/src/permissions.js`) drives the
  web app's menus and the API's checks.
- Every query is limited to the user's own school: another school's ids return `404`.
- There is no public sign-up. School admins create staff accounts on the Staff page
  (`/api/v1/users`).
- **Teachers see only the students assigned to them** (the "Class teacher" field on a
  student, set by an administrator or principal). That covers students, attendance,
  marks and the assessments for those students' classes. Teachers can update guardian
  contact and support notes, but not enrolment details.

### Records API

| Area | Endpoints |
| --- | --- |
| Students | `GET/POST /students`, `GET/PATCH /students/:id`, `PATCH /students/:id/status`, `GET /students/:id/summary` |
| Attendance | `GET /attendance`, `GET /attendance/overview`, `GET /attendance/register`, `GET /attendance/student/:studentId`, `POST /attendance`, `POST /attendance/bulk`, `PATCH /attendance/:id`, `DELETE /attendance/:id` |
| Assessments | `GET/POST /assessments`, `GET /assessments/overview`, `GET/PATCH/DELETE /assessments/:id` |
| Marks | `POST /marks`, `POST /marks/bulk`, `PATCH /marks/:id`, `DELETE /marks/:id` |
| Risk | `GET /risk`, `GET /risk/overview`, `GET /risk/:studentId`, `POST /risk/recalculate/:studentId`, `POST /risk/recalculate` (admin, principal), `POST /risk/:studentId/review` |
| Interventions | `GET/POST /interventions`, `GET /interventions/overview`, `GET/PATCH /interventions/:id`, `PATCH /interventions/:id/status` |
| Dashboard | `GET /dashboard/overview` (admin, principal), `GET /dashboard/teacher` (teacher), `GET /dashboard/attention` |
| Family meetings | `GET/POST /students/:id/parent-meetings` |

- One attendance record per student per day, and one mark per student per assessment
  (`409` on duplicates). The bulk endpoints save a whole register or marks sheet at once:
  all entries are checked first, and nothing is saved if any is invalid.
- Teachers can correct only the attendance they recorded; administrators and principals
  can correct any. Deleting an attendance record or a mark is for administrators only,
  needs a reason, and keeps a copy in the audit log.
- Students are never deleted — their status changes instead, and their history is kept.
- Every change to attendance, marks, the financial-barrier flag or enrolment status
  recalculates that student's risk indicator straight away.
- "Today" (for future-date checks and overdue follow-ups) is the school's date, set by
  `SCHOOL_TIMEZONE` (default `Asia/Kolkata`).
- An intervention becomes overdue at midnight without anyone touching it, so whenever
  risk is read (risk list, overview, dashboard) the API first recalculates any score that
  was last calculated before today.
- Interventions are never deleted: they are completed (with an outcome) or cancelled
  (with a reason). Teachers see interventions for their students plus any they created
  or own.

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

## Demo accounts

Created by `npm run db:seed` (and built into mock mode). All use the password
`Udaan@123` — it is public, so only use the seed on a demo database.

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
| `VITE_USE_MOCKS`     | client  | `true` to use built-in demo data instead of the API (default `false`) |
| `VITE_SHOW_DEMO_ACCOUNTS` | client | `true` to list the demo accounts on the login page (always on in mock mode) |
| `DATABASE_URL`       | server  | PostgreSQL connection used by the API (Neon: pooled string)    |
| `DATABASE_URL_UNPOOLED` | server | Direct connection used only for migrations (Neon)            |
| `PORT`               | server  | Local API port (default `5000`)                                |
| `CORS_ORIGINS`       | server  | Only if the web app runs on another origin (comma-separated)   |
| `DB_POOL_MAX`        | server  | Connections per API instance (default `5`)                     |
| `JWT_SECRET`         | server  | Signs login tokens — 32+ random characters, secret             |
| `JWT_EXPIRES_IN`     | server  | Session length (default `8h`)                                  |
| `BCRYPT_ROUNDS`      | server  | Password hashing cost (default `12`)                           |
| `SCHOOL_TIMEZONE`    | server  | The school's timezone for "today" (default `Asia/Kolkata`)     |
| `LOGIN_RATE_LIMIT`   | server  | Failed sign-ins allowed per email and IP per 15 min (default `10`) |

## Deployment (Vercel)

The web app and the API deploy together as one Vercel project on one domain.
`vercel.json` runs `npm run build` (Prisma client + web app), serves `client/dist` with an
`index.html` fallback, and deploys `api/index.js` (the Express app) as a serverless
function that handles every `/api/*` request.

1. **Database first.** Migrations are applied from your machine, never during the build:
   `npm run db:deploy`, then (for the demo) `npm run db:seed`.
2. **Import the repository** in Vercel → *Add New… → Project*. Keep **Root Directory**
   as the repository root and leave the framework preset as *Other*; `vercel.json`
   supplies the commands.
3. **Environment variables** (*Project → Settings → Environment Variables*, for
   Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`) |
   | `JWT_SECRET` | a **new** random value: `openssl rand -base64 48` — not your local one |
   | `SCHOOL_TIMEZONE` | optional, default `Asia/Kolkata` |
   | `VITE_SHOW_DEMO_ACCOUNTS` | optional, `true` only for a public demo |

   `DATABASE_URL_UNPOOLED` is not needed on Vercel (only migrations use it).
   Paste only the value itself — no quotes, no `NAME=` prefix, no `psql` command around
   the connection string. Variable changes take effect on the next deployment.
4. **Deploy**, then check `https://<your-app>.vercel.app/api/v1/health/db`: it should
   return `"database":"ok"` and the latest migration name. For this project:
   https://student-dropout-prevention-system.vercel.app/api/v1/health/db

Notes:
- The API uses `node-postgres` with a small pool registered through
  `attachDatabasePool` (`@vercel/functions`), so idle connections are released when an
  instance goes idle. Function time limit: 30 s (`vercel.json`).
- After changing `schema.prisma`, create the migration locally (`npm run db:migrate`),
  commit it, and run `npm run db:deploy` against Neon before deploying the new code.
- The login rate limit is kept in memory, so each serverless instance counts on its own.
- If the API fails to start, the deployment's **Logs** tab shows the reason (for example,
  which environment variable is invalid). Vercel's "server error" page on sign-in usually
  means a missing or malformed `DATABASE_URL` or `JWT_SECRET`.

## Demo walkthrough

A five-minute tour of the seeded demo school — locally or on the
[live demo](https://student-dropout-prevention-system.vercel.app/login) (password
`Udaan@123` for every account):

1. **Admin (`admin@udaan.demo`) — Dashboard.** 9 active students, attendance with its
   denominator explained, 3 high-risk flags, and one overdue follow-up (Sneha).
2. **Risk Monitoring.** Each flag lists its reasons and points; open *How the score
   works* for the rule table. Review Aarav's flag with a note — *Awaiting review* drops.
3. **Interventions.** Open Sneha's overdue case: the risk reasons from when it was
   opened, the action plan and its history. Complete it with an outcome — her score
   falls from 50 to 40 because the overdue rule no longer applies.
4. **Academics.** Create an assessment for Grade 8 · A and enter marks; a score above
   the maximum is rejected, and saving updates the students' risk straight away.
5. **Attendance.** Take the register for a class; corrections show who recorded each
   entry.
6. **Teacher (`teacher@udaan.demo`).** Neha sees only her 4 assigned students, her own
   dashboard and follow-ups, and no Staff page.
7. **Staff (admin).** Add a staff account with a temporary password, or deactivate one —
   that person is signed out on their next request.

## Privacy note

This is a prototype. Use only fictional demo data. Do not load real student or
guardian information or family meeting notes without institutional authorization
and a privacy review. Meeting notes are visible to staff authorized to view that student.
