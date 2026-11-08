# Udaan — Student Retention & Early Intervention Platform

> Identify early. Intervene meaningfully. Keep learning on track.

Udaan helps school staff notice early warning signs (attendance, academic
decline, reported barriers), understand **why** a student was flagged through a
transparent rule-based score, and track human-led interventions to completion.

## Repository layout

```
.
├── client/          Udaan web app (React 18 + Vite)
├── server/          Udaan API (Express + Prisma 7 + PostgreSQL)      (coming soon)
├── shared/          Business rules shared by client and server (attendance metrics, risk rules)
├── api/             Vercel serverless entry that exposes the Udaan API (coming soon)
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
npm install                      # installs all workspaces from the repo root
cp client/.env.example client/.env.local
npm run dev                      # Udaan web app on http://localhost:3000
```

With `VITE_USE_MOCKS=true` (the default in `.env.example`) the web app runs
entirely on local mock data, so the API is not required yet.

### Scripts (run from the repo root)

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the web app dev server         |
| `npm run build`   | Production build into `client/dist`  |
| `npm run preview` | Preview the production build         |
| `npm test`        | Run the unit tests in every workspace |

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

| Variable             | Where   | Purpose                                              |
| -------------------- | ------- | ---------------------------------------------------- |
| `VITE_API_BASE_URL`  | client  | API base path (default `/api/v1`)                    |
| `VITE_DEV_API_PROXY` | client  | Local Express URL the dev server proxies `/api` to   |
| `VITE_USE_MOCKS`     | client  | `true` to use local mock data instead of the API     |

Never commit real `.env` files — only the `.env.example` templates.

## Deployment (Vercel)

1. Import this repository into Vercel (leave **Root Directory** as the repo root).
2. Vercel reads `vercel.json`: it runs `npm run build` and serves `client/dist`.
3. Backend environment variables (`DATABASE_URL`, `JWT_SECRET`, …) will be
   documented here once the server is added.

## Privacy note

This is a prototype. Use only fictional demo data. Do not load real student or
guardian information without institutional authorization and a privacy review.
