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
