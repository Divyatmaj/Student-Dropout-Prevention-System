# 🎓 Udaan — Student Retention & Early Intervention Platform

> **Notice early. Intervene meaningfully. Keep every student's learning on track.**

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Bundler](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌐 Live Application & Demo Access

- **Production URL:** [https://student-dropout-prevention-system.vercel.app/login](https://student-dropout-prevention-system.vercel.app/login)
- **Demo Password:** `Udaan@123` (shared across all pre-seeded accounts)
- **Instant Testing:** Works directly in **Fullstack Database Mode** or standalone **Mock Mode** (`VITE_USE_MOCKS=true`) without external database setup.

| Role | Demo Email | Access Scope |
| :--- | :--- | :--- |
| **School Administrator** | `admin@udaan.demo` | Full access, institutional configuration & staff management |
| **Principal** | `principal@udaan.demo` | Whole-school visibility, academic oversight & risk monitoring |
| **Class Teacher** | `teacher@udaan.demo` | Assigned class roster, daily attendance, marks & interventions |
| **Subject Teacher** | `farhan.khan@udaan.demo` | Class teacher view for assigned secondary section |

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Application Workflow & Risk Engine](#-application-workflow--risk-engine)
- [Tech Stack](#-tech-stack)
- [Repository & Monorepo Structure](#-repository--monorepo-structure)
- [Database Schema & Models](#-database-schema--models)
- [Installation & Local Setup](#-installation--local-setup)
- [Environment Variables](#-environment-variables)
- [REST API Reference](#-rest-api-reference)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Deployment Guide](#-deployment-guide)
- [Future Improvements & Roadmap](#-future-improvements--roadmap)
- [Privacy, Ethics & Data Governance](#-privacy-ethics--data-governance)
- [Contributors & License](#-contributors--license)

---

## 📌 Project Overview

Student dropouts are rarely sudden events; they are the culmination of gradual disengagement signaled through **attendance decline**, **academic distress**, **socioeconomic barriers**, and **unaddressed intervention gaps**.

Traditional student information systems record these events in isolation, leaving educators to manually connect the dots when it is often too late. Meanwhile, black-box AI models produce arbitrary risk probabilities that teachers neither trust nor understand.

**Udaan** is an open, human-centered early intervention and student retention platform engineered for schools. It combines:
1. **Deterministic, 100% Explainable Risk Scoring:** A transparent 0–100 weighted indicator derived from explicit educational rules. Every single risk point is traced to an understandable root cause.
2. **Unified Data Ingestion:** Integrates daily classroom attendance registers, multi-subject assessments, and reported socioeconomic barriers into a longitudinal timeline.
3. **Actionable Intervention Lifecycles:** Transitions flags into owned, time-bound support casework with milestone tracking, parent conference logs, and audit-trailed outcomes.
4. **Tenant Isolation & Role Protection:** Strict multi-school data boundaries where class teachers view only their assigned cohorts, while principals and administrators retain strategic institutional oversight.

---

## ✨ Key Features

### 📊 1. Executive & Teacher Dashboards
- **Adaptive Scope:** Principals and admins see school-wide trends; teachers receive a customized workspace scoped strictly to their assigned students.
- **Attendance Analytics:** 30-, 60-, and 90-day attendance rates with clear denominator breakdowns (excluding excused medical days).
- **Interactive Deep-Links:** Headline indicator cards link directly to filtered views (`High Risk`, `Open Follow-ups`, `Attendance Alerts`).
- **Urgent Attention Roster:** Real-time list of students requiring immediate human check-ins with their primary trigger reasons.

### 👥 2. Student Registry & Longitudinal Profiles
- **Non-Destructive Records:** Students are never deleted; lifecycle states (`ACTIVE`, `INACTIVE`, `TRANSFERRED`, `COMPLETED`) preserve academic history.
- **Holistic Context:** Tracks guardian contact info, support notes, socioeconomic flags, strengths, and personal interests.
- **Bulk CSV Import:** Ingest up to 50 students per batch with dry-run validation, duplicate code detection, and transactional commit.
- **Profile Utility:** Single-click clipboard copying for student admission codes with immediate visual feedback.

### 📅 3. Attendance Management & Daily Register
- **Class Register Workflow:** Quick mark-all-present with individual toggles for `Absent`, `Late`, and `Excused`.
- **Reason Categorization:** Detailed tags for non-attendance (`Illness`, `Transport`, `Family Emergency`, `Appointment`, `Other`).
- **Audit-Trailed Corrections:** Tracks who recorded and modified every record; administrative deletion requires written justification.
- **Quick-Date Filters:** One-click `"Today"` button to toggle between historical logs and current day records.
- **CSV Data Export:** Export full attendance histories formatted safely against spreadsheet formula injection.

### 📈 4. Academic Performance Tracking
- **Class-Level Assessments:** Configure term exams, unit tests, and quizzes with custom maximum marks.
- **Bounds-Checked Mark Entry:** Bulk score entry with real-time validation against maximum thresholds.
- **Subject Drop Detection:** Automatically detects and alerts on historical performance drops $\ge 10\%$ in the same subject.

### 🛡️ 5. Early Warning Risk Engine
- **Shared Rule Engine (`@udaan/shared`):** Single source of truth executed identically across frontend and backend.
- **Human Review Safeguard:** Every medium or high risk flag requires periodic human sign-off with staff notes.
- **Data Completeness Indicators:** Flags scores as `PROVISIONAL` (< 10 attendance days) or `INSUFFICIENT DATA` instead of misleadingly marking students as "Low Risk".

### 🎯 6. Intervention & Casework Lifecycle
- **End-to-End Tracking:** Support actions move across `OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` or `CANCELLED`.
- **Risk Snapshot Preservation:** Freezes student risk scores and reasons at the moment the case was opened for before-and-after comparison.
- **Overdue Penalties:** Automatically escalates unresolved cases past their due date, applying an urgent +10 point risk penalty.
- **Full History Log:** Append-only timeline documenting status transitions, reassignments, and counselor progress notes.

### 👨‍👩‍👧 7. Family Meeting Journal
- **Confidential Records:** Secure date-stamped conference notes logging guardian attendees, discussions, and agreed actions.
- **Follow-up Reminders:** Links directly into student profiles to ensure home-school agreements are honored.

---

## 🏛️ System Architecture

Udaan is structured as a modern **npm workspaces monorepo** deploying as a unified application. The React Single Page Application (SPA) and the Express serverless API live under a single domain on Vercel, eliminating cross-origin complexity while sharing business rules from `@udaan/shared`.

```mermaid
flowchart TD
    subgraph ClientWorkspace["Frontend Client (client/)"]
        SPA["React 18 SPA (Vite)"]
        Router["React Router v6"]
        UI["Accessible Component Library"]
        Mocks["In-Memory Mock Adapter"]
    end

    subgraph SharedWorkspace["Shared Core (shared/)"]
        Rules["@udaan/shared<br/>• Risk Engine & Weighted Rules<br/>• Attendance Calculations<br/>• RBAC Permissions & Enums"]
    end

    subgraph VercelEdge["Unified Deployment (Vercel Platform)"]
        Edge["Vercel Edge Gateway"]
        StaticAssets["Static Client Assets (/dist)"]
        ServerlessEntry["Serverless API Entry (/api/v1/*)"]
    end

    subgraph ServerWorkspace["Backend API (server/)"]
        ExpressApp["Express 5 Application"]
        Security["Helmet & Rate Limiter"]
        AuthMiddleware["JWT Authentication & RBAC"]
        Controllers["Resource Controllers"]
        PrismaAdapter["Prisma ORM 7 (@prisma/adapter-pg)"]
    end

    subgraph DatabaseCloud["Cloud Persistence (Neon PostgreSQL)"]
        Pooler["PgBouncer Pooled Connection (API Runtime)"]
        Direct["Direct TCP Connection (Prisma Migrations)"]
    end

    SPA --> Router
    Router --> UI
    UI -.-> Mocks
    UI --> Edge

    Edge -->|Static Files| StaticAssets
    Edge -->|/api/v1/*| ServerlessEntry
    ServerlessEntry --> ExpressApp

    ExpressApp --> Security
    Security --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> PrismaAdapter

    PrismaAdapter --> Pooler
    Pooler --> DatabaseCloud
    Direct --> DatabaseCloud

    SPA -.-> Rules
    ExpressApp -.-> Rules
```

---

## 🔄 Application Workflow & Risk Engine

### 1. Data Collection to Casework Workflow

```mermaid
flowchart TD
    Start["Daily School Activities"] --> Att["Attendance Register Recorded"]
    Start --> Marks["Assessment Marks Ingested"]
    Start --> Status["Barrier or Status Modified"]

    Att --> Engine["@udaan/shared Risk Engine"]
    Marks --> Engine
    Status --> Engine

    Engine --> ScoreCalc["Evaluate 5 Weighted Rules (0–100)"]
    ScoreCalc --> CategoryFork{"Determine Category"}

    CategoryFork -->|0 – 24 pts| CatLow["Low Risk (On Track)"]
    CategoryFork -->|25 – 49 pts| CatMed["Medium Risk (Monitor Closely)"]
    CategoryFork -->|50 – 100 pts| CatHigh["High Risk (Urgent Action)"]
    CategoryFork -->|< 10 Days Data| CatProv["Provisional / Insufficient Data"]

    CatMed --> DashboardAlert["Flagged on Principal / Teacher Dashboard"]
    CatHigh --> DashboardAlert

    DashboardAlert --> HumanReview["Staff Review & Diagnostic Evaluation"]
    HumanReview --> OpenIntervention["Open Targeted Intervention"]

    OpenIntervention --> Assign["Assign Owner, Priority & Due Date"]
    Assign --> FamilyConf["Log Parent/Guardian Meeting"]
    FamilyConf --> CaseAction["Execute Support Action Plan"]

    CaseAction --> OutcomeCheck{"Is Concern Resolved?"}
    OutcomeCheck -->|Yes| CompleteCase["Close Case with Written Outcome"]
    OutcomeCheck -->|Past Due Date| OverduePenalty["Trigger +10 Overdue Risk Penalty"]

    CompleteCase --> Engine
    OverduePenalty --> Engine
```

### 2. The 0–100 Transparent Risk Formula

Unlike predictive black-box algorithms, Udaan evaluates explicit, verifiable indicators. The score directly reflects actionable institutional metrics:

| Risk Trigger Condition | Assigned Weight | Educational Rationale |
| :--- | :---: | :--- |
| **Severe Chronic Absence** (Rate $< 75\%$) | **+30 pts** | Missing $> 1$ day per week critically disrupts curriculum continuity. |
| **Moderate Attendance Dip** (Rate $75\% \le r < 85\%$) | **+15 pts** | Early slippage indicating emerging disengagement. |
| **Prolonged Consecutive Absences** ($\ge 5$ school days) | **+25 pts** | High acute correlation with unannounced school dropout. |
| **Short Consecutive Absences** ($3 - 4$ school days) | **+15 pts** | Warning indicator of potential illness, family emergency, or truancy. |
| **Severe Subject Score Drop** ($\ge 20\%$ decline) | **+20 pts** | Acute academic struggle in a previously passed subject. |
| **Moderate Subject Score Drop** ($10\% - 19.9\%$ decline) | **+10 pts** | Emerging academic distress requiring subject tutoring. |
| **Reported Socioeconomic Barrier** | **+10 pts** | Financial stress, fee hardship, or lack of learning resources. |
| **Overdue Active Intervention** | **+10 pts** | Institutional failure to resolve an existing open support action. |

```mermaid
flowchart LR
    subgraph Triggers["Input Indicators"]
        T1["Attendance Rate"]
        T2["Consecutive Absences"]
        T3["Same-Subject Drop"]
        T4["Financial Barrier"]
        T5["Overdue Intervention"]
    end

    subgraph Scoring["Rule Evaluation"]
        S1["< 75%: +30<br/>75–84.9%: +15"]
        S2["5+ Days: +25<br/>3–4 Days: +15"]
        S3[">= 20% Drop: +20<br/>10–19.9%: +10"]
        S4["Barrier Reported: +10"]
        S5["Past Due Date: +10"]
    end

    subgraph Result["Classification"]
        Score["Total Score (0–100)"]
        Band1["Low (0–24)"]
        Band2["Medium (25–49)"]
        Band3["High (50+)"]
    end

    T1 --> S1
    T2 --> S2
    T3 --> S3
    T4 --> S4
    T5 --> S5

    S1 --> Score
    S2 --> Score
    S3 --> Score
    S4 --> Score
    S5 --> Score

    Score --> Band1
    Score --> Band2
    Score --> Band3
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `18.3.1` | Component-driven UI architecture with hooks and clean state separation |
| **Build Tool** | Vite | `5.4.11` | Ultra-fast HMR and optimized production asset bundling |
| **Routing** | React Router DOM | `6.28.0` | Client-side routing, protected routes, and query deep-linking |
| **Iconography** | Lucide React | `0.460.0` | Clean, accessible SVG iconography |
| **Styling** | Vanilla CSS Variables | CSS3 | Native design system tokens, zero-runtime CSS overhead, dark/light ready |
| **Backend Framework** | Express | `5.2.1` | REST API framework running on Node.js and Vercel Serverless |
| **ORM & Database** | Prisma | `7.10.1` | Type-safe schema definition, automated migrations, and queries |
| **Database Engine** | PostgreSQL (Neon) | `16.x` | Serverless cloud PostgreSQL with connection pooling via PgBouncer |
| **Security & Auth** | JWT & Bcrypt.js | `9.0` / `3.0` | Stateless token authentication with salted password hashing (12 rounds) |
| **Protection** | Helmet & Rate Limit | `8.3` / `8.7` | HTTP security headers and brute-force mitigation on auth routes |
| **Shared Core** | `@udaan/shared` | Internal | Isomorphic business rules, risk scoring, permissions, and validators |
| **Testing** | Vitest & Supertest | `2.1.8` | High-speed unit testing and end-to-end HTTP integration tests |

---

## 📂 Repository & Monorepo Structure

```text
Student-Dropout-Prevention-System/
├── api/                             # Vercel serverless function entry
│   └── index.js                     # Wraps server/src/app.js for Vercel Functions
├── client/                          # React + Vite frontend workspace
│   ├── public/                      # Static assets & favicon
│   ├── src/
│   │   ├── components/              # Modular UI components
│   │   │   ├── attendance/          # ClassRegister, AttendanceRecords, CSV export
│   │   │   ├── auth/                # ProtectedRoute & permission guards
│   │   │   ├── common/              # Button, SearchBar, Badge, Modal, StatCard, States
│   │   │   ├── interventions/       # InterventionFormModal, DetailModal, History
│   │   │   ├── risk/                # RiskExplanation, ReviewRiskModal
│   │   │   └── students/            # StudentFormModal, StatusModal, ParentMeetingLog
│   │   ├── constants/               # Client-side labels, options & constants
│   │   ├── data/                    # In-memory mock datasets (fallback mode)
│   │   ├── hooks/                   # useAuth, useDebounce custom React hooks
│   │   ├── pages/                   # Dashboard, Students, Attendance, Academics, Risk, etc.
│   │   ├── services/                # API client adapters (HTTP fetch wrappers)
│   │   └── utils/                   # Formatters, permission checkers, calculations
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Client workspace manifest
│   └── vite.config.js               # Vite config with API proxy for development
├── server/                          # Express + Prisma backend workspace
│   ├── prisma/
│   │   ├── schema.prisma            # Multi-model relational database schema
│   │   ├── seed.js                  # Demo institution seed data script
│   │   └── migrations/              # SQL migration history
│   ├── src/
│   │   ├── config/                  # Prisma pg adapter & environment configuration
│   │   ├── controllers/             # Request handlers (auth, students, risk, etc.)
│   │   ├── middleware/              # Auth verification, RBAC, error handlers
│   │   ├── routes/                  # Express v1 route definitions
│   │   ├── services/                # Business logic & database operations
│   │   ├── app.js                   # Express app setup & middleware mounting
│   │   └── server.js                # Local server entry (port 5000)
│   └── package.json                 # Server workspace manifest
├── shared/                          # Isomorphic shared library workspace
│   ├── src/
│   │   ├── attendance.js            # Unified attendance rate & streak logic
│   │   ├── constants.js             # Grade levels, sections, status enums
│   │   ├── index.js                 # Shared library export root
│   │   ├── interventions.js         # Intervention categories, priorities & transitions
│   │   ├── permissions.js           # RBAC permission matrix
│   │   └── risk.js                  # 0–100 Rule-based risk calculation engine
│   └── package.json                 # Shared package manifest
├── neon.ts                          # Neon branch configuration
├── vercel.json                      # Vercel deployment routing & build orchestration
└── package.json                     # Root monorepo workspace configuration
```

---

## 🗄️ Database Schema & Models

The database schema is managed via **Prisma 7** targeting PostgreSQL. Every institutional entity is scoped by `schoolId` to guarantee strict multi-tenant isolation.

```mermaid
erDiagram
    School ||--o{ User : "employs"
    School ||--o{ Student : "enrols"
    School ||--o{ Assessment : "manages"
    School ||--o{ Intervention : "coordinates"
    
    User ||--o{ Student : "assigned as class teacher"
    User ||--o{ Attendance : "records"
    User ||--o{ StudentMark : "enters"
    User ||--o{ RiskAssessment : "reviews"
    User ||--o{ Intervention : "owns / creates"
    User ||--o{ ParentMeetingLog : "logs"

    Student ||--o{ Attendance : "has daily"
    Student ||--o{ StudentMark : "receives"
    Student ||--o| RiskAssessment : "evaluated by"
    Student ||--o{ Intervention : "supported by"
    Student ||--o{ ParentMeetingLog : "subject of"

    Assessment ||--o{ StudentMark : "contains"
    Intervention ||--o{ InterventionEvent : "appends history"
```

### Relational Entity Summary

| Model | Table Name | Core Responsibilities & Attributes |
| :--- | :--- | :--- |
| **`School`** | `schools` | Multi-tenant tenant boundary; institutional code and settings. |
| **`User`** | `users` | Staff credentials, bcrypt password hash, assigned role, active state. |
| **`Student`** | `students` | Admission number, grade, section, guardian details, barriers, support notes. |
| **`Attendance`** | `attendance` | Unique `(studentId, date)` pair; status (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`), reason. |
| **`Assessment`** | `assessments` | Class-level test/exam metadata, subject, grade, section, maximum marks. |
| **`StudentMark`** | `student_marks` | Unique `(studentId, assessmentId)` scored marks record. |
| **`RiskAssessment`**| `risk_assessments`| One-to-one per active student; score (0–100), category, reason JSON, review audit. |
| **`Intervention`** | `interventions` | Student support case; concern category, priority, assignee, due date, outcome. |
| **`InterventionEvent`**| `intervention_events`| Append-only history logging status changes, assignments, and counselor progress notes. |
| **`ParentMeetingLog`**| `parent_meeting_logs`| Sensitive conference logs with guardians, attendees, and agreed action plans. |
| **`AuditLog`** | `audit_logs` | Immutable audit trail capturing sensitive deletes and administrative overrides. |

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js:** `v20.0.0` or higher
- **npm:** `v10.0.0` or higher
- **PostgreSQL:** Neon Cloud PostgreSQL account (recommended) or local PostgreSQL instance

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/aasthamusale/Student-Dropout-Prevention-System.git
cd Student-Dropout-Prevention-System

# Installs dependencies across client, server, and shared workspaces
npm install
```

### Step 2: Choose Your Operating Mode

Udaan supports two distinct local development workflows:

#### Option A: Fast Frontend Mode (Zero Database Setup)
Ideal for testing UI components, responsive layouts, and interactive workflows without installing PostgreSQL.

```bash
# 1. Copy the client environment file
cp client/.env.example client/.env.local

# 2. Enable in-memory mock mode
echo "VITE_USE_MOCKS=true" >> client/.env.local

# 3. Start the Vite development server
npm run dev:web
```
*The web app will run at `http://localhost:3000` pre-loaded with comprehensive demo datasets.*

---

#### Option B: Fullstack Mode (With PostgreSQL & Neon)
Connects the React frontend, Express API, and cloud PostgreSQL database.

1. **Configure Server Environment:**
   Create `server/.env` with your PostgreSQL connection strings:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@ep-sample-pooler.neon.tech/udaan?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://user:password@ep-sample.neon.tech/udaan?sslmode=require"
   JWT_SECRET="your-super-secret-random-key-at-least-32-chars-long"
   JWT_EXPIRES_IN="8h"
   BCRYPT_ROUNDS=12
   SCHOOL_TIMEZONE="Asia/Kolkata"
   ```

2. **Configure Client Environment:**
   Create `client/.env.local`:
   ```env
   VITE_API_BASE_URL="/api/v1"
   VITE_DEV_API_PROXY="http://localhost:5000"
   VITE_USE_MOCKS=false
   VITE_SHOW_DEMO_ACCOUNTS=true
   ```

3. **Deploy Migrations & Seed Database:**
   ```bash
   # Run Prisma migrations against the database
   npm run db:deploy

   # Seed default demo school, staff, students, and records
   npm run db:seed
   ```

4. **Launch Both Applications Concurrently:**
   ```bash
   npm run dev
   ```
   - **Client App:** `http://localhost:3000`
   - **Express API:** `http://localhost:5000`
   - **Health Check:** `http://localhost:5000/api/v1/health/db`

---

## ⚙️ Environment Variables

### Client Workspace (`client/.env.local`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | `/api/v1` | Base relative path prefix for API requests. |
| `VITE_DEV_API_PROXY` | URL | `http://localhost:5000` | Target URL used by Vite dev server to proxy `/api` calls. |
| `VITE_USE_MOCKS` | Boolean | `false` | When `true`, runs completely on in-memory mock data without API. |
| `VITE_SHOW_DEMO_ACCOUNTS` | Boolean | `false` | Displays clickable quick-fill demo account pills on Login page. |

### Server Workspace (`server/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | Port for the local Express HTTP server. |
| `DATABASE_URL` | String | *Required* | Pooled PostgreSQL connection string (PgBouncer). |
| `DATABASE_URL_UNPOOLED` | String | *Optional* | Direct PostgreSQL TCP connection used for migrations. |
| `JWT_SECRET` | String | *Required* | Secret key for signing JSON Web Tokens (min 32 chars). |
| `JWT_EXPIRES_IN` | String | `8h` | Session token validity duration. |
| `BCRYPT_ROUNDS` | Number | `12` | Salt calculation cost factor for password hashing. |
| `SCHOOL_TIMEZONE` | String | `Asia/Kolkata` | IANA timezone used to determine "today" for attendance & overdue checks. |
| `LOGIN_RATE_LIMIT` | Number | `10` | Max failed login attempts allowed per IP/email per 15 minutes. |
| `CORS_ORIGINS` | String | `""` | Optional comma-separated origins if running frontend on a separate host. |

---

## 📡 REST API Reference

All endpoints are prefixed with `/api/v1`. Authenticated requests require the `Authorization: Bearer <token>` header.

### Standard Response Envelope

```json
// Successful Response
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      { "field": "score", "message": "Score cannot exceed assessment max marks (50)" }
    ]
  }
}
```

### Endpoint Matrix

| Module | Method & Path | Description | Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /auth/login` | Authenticate credentials & retrieve JWT token | Public |
| | `GET /auth/me` | Retrieve profile of currently authenticated user | Authenticated |
| **Students** | `GET /students` | Paginated list of students with filters & search | Authenticated |
| | `POST /students` | Enrol a new student into the school register | Admin, Principal |
| | `GET /students/:id` | Full student profile including attendance & risk | Scoped |
| | `PATCH /students/:id` | Update student guardian or contact details | Scoped |
| | `PATCH /students/:id/status` | Change student lifecycle state (`TRANSFERRED`, etc.) | Admin, Principal |
| | `POST /students/import` | Bulk import up to 50 students from parsed CSV | Admin, Principal |
| **Attendance**| `GET /attendance/register` | Daily attendance register grid for grade/section | Scoped |
| | `POST /attendance/bulk` | Ingest class register with validation safeguards | Scoped |
| | `GET /attendance/overview` | School-wide attendance statistics and trends | Authenticated |
| | `PATCH /attendance/:id` | Correct attendance entry with audit logging | Author / Admin |
| | `DELETE /attendance/:id` | Administrative removal of erroneous attendance log | Admin Only |
| **Academics** | `GET /assessments` | Retrieve assessments for class cohorts | Scoped |
| | `POST /assessments` | Create a test/exam specification | Scoped |
| | `POST /marks/bulk` | Enter assessment marks for students in batch | Scoped |
| **Risk Engine**| `GET /risk` | Filterable risk list with score breakdowns | Authenticated |
| | `GET /risk/overview` | School-wide high/medium/low distribution | Authenticated |
| | `POST /risk/:id/review` | Record human review note on student risk flag | Authenticated |
| | `POST /risk/recalculate` | Re-run batch evaluation across all enrolled students | Admin, Principal |
| **Interventions**| `GET /interventions` | Filterable list of student intervention cases | Scoped |
| | `POST /interventions` | Open a new intervention case with risk snapshot | Scoped |
| | `PATCH /interventions/:id/status` | Transition case status (`IN_PROGRESS`, `COMPLETED`)| Owner / Admin |
| **Dashboard** | `GET /dashboard/overview` | Whole-school executive KPI figures & alerts | Admin, Principal |
| | `GET /dashboard/teacher` | Teacher-scoped KPIs for assigned cohorts | Teachers |
| **Meetings** | `GET /students/:id/parent-meetings` | Retrieve family engagement conference history | Scoped |
| | `POST /students/:id/parent-meetings` | Record confidential guardian meeting journal | Scoped |

---

## 🔐 Role-Based Access Control (RBAC)

Udaan enforces least-privilege role separation defined declaratively in `shared/src/permissions.js`:

| Capability / Module | School Admin | Principal | Class Teacher |
| :--- | :---: | :---: | :---: |
| **Manage Staff Accounts** | ✅ | ❌ | ❌ |
| **View Whole-School Dashboard** | ✅ | ✅ | ❌ *(Assigned cohort only)* |
| **Enrol & Transfer Students** | ✅ | ✅ | ❌ |
| **View Assigned Students** | ✅ | ✅ | ✅ *(Assigned cohort only)* |
| **Record Attendance & Marks** | ✅ | ✅ | ✅ *(Assigned cohort only)* |
| **Correct Any Attendance Record** | ✅ | ✅ | ❌ *(Own records only)* |
| **Delete Attendance (Audited)** | ✅ | ❌ | ❌ |
| **Initiate Interventions** | ✅ | ✅ | ✅ |
| **Review & Sign-Off Risk Flags** | ✅ | ✅ | ✅ |
| **Log Family Conference Meetings** | ✅ | ✅ | ✅ *(Assigned cohort only)* |

---

## 🌐 Deployment Guide

Udaan is architected to deploy as **a single unified Vercel project on one domain**:
- `vercel.json` coordinates building both workspaces (`client` and `server`).
- The client SPA is served statically from `client/dist` with client-side fallback routing (`/*` $\rightarrow$ `index.html`).
- The Express API is bundled via `api/index.js` as a Vercel Serverless Function servicing `/api/v1/*`.
- **Zero CORS Needed:** Because both the frontend and backend share the identical origin in production, cross-origin security friction is eliminated.

### Production Deployment Steps

1. **Provision Neon PostgreSQL:**
   Create a project on [Neon](https://neon.tech) and copy your **Pooled** connection string.
2. **Apply Migrations Locally:**
   ```bash
   DATABASE_URL="<your-neon-direct-url>" npm run db:deploy
   DATABASE_URL="<your-neon-pooled-url>" npm run db:seed  # Optional for demo data
   ```
3. **Import into Vercel:**
   - Link your GitHub repository in the Vercel Dashboard.
   - Leave Root Directory as `./` (repository root).
   - Preset: **Other** (configured automatically by `vercel.json`).
4. **Configure Production Environment Variables:**
   - `DATABASE_URL`: Your Neon pooled connection string.
   - `JWT_SECRET`: A high-entropy 48-byte random string (`openssl rand -base64 48`).
   - `SCHOOL_TIMEZONE`: e.g. `Asia/Kolkata`.
   - `VITE_SHOW_DEMO_ACCOUNTS`: `false` (or `true` for public demonstrator).
5. **Trigger Deployment:**
   Deploy and verify API connectivity via `https://<your-deployment>.vercel.app/api/v1/health/db`.

---

## 🔮 Future Improvements & Roadmap

- [ ] **Automated SMS & WhatsApp Guardian Alerts:** Integrated dispatch for daily unexplained absences via Twilio/Gupshup.
- [ ] **Offline PWA Support:** Service worker synchronization allowing teachers to record daily attendance without active internet connectivity.
- [ ] **Student Growth & Report Card Export:** PDF generation synthesizing term grades, attendance streaks, and strengths for parent-teacher conferences.
- [ ] **Multi-School District Dashboard:** High-level comparative overview for educational departments managing multiple schools.
- [ ] **Early Warning Signal Customization:** Institutional configuration panel to fine-tune rule weightings based on regional attendance guidelines.

---

## 🛡️ Privacy, Ethics & Data Governance

1. **Aid, Not a Verdict:** The Udaan risk indicator is a **prioritization aid** designed to help counselors identify who needs check-ins first. It is never an algorithmic prediction of student destiny and must never be used for punitive measures.
2. **Explainability First:** Black-box machine learning models that generate risk scores without transparent reasoning are intentionally prohibited. Every single risk point must correlate with an observable educational event.
3. **Data Minimization:** Sensitive support notes and parent meeting logs are strictly sequestered from dashboards and bulk exports, accessible only to authorized staff directly supervising that student.
4. **Prototype Notice:** This platform is designed for demonstration and institutional evaluation. When deploying in live educational settings, ensure compliance with local student data privacy regulations (e.g., FERPA, GDPR, DPDP Act).

---

## 👥 Contributors & License

### Project Contributor
- **Aastha Musale** — Lead Architecture, Frontend Design & Fullstack Implementation

### License
This project is open-source and available under the **[MIT License](LICENSE)**.

---

<div align="center">
  <sub>Built with care to ensure every student has the support they need to complete their education.</sub>
</div>
