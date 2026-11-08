# PRD.md --- Student Retention & Early Intervention Platform

> **Working product name:** Udaan\
> **Tagline:** Identify early. Intervene meaningfully. Keep learning on
> track.\
> **Version:** 1.0 MVP\
> **Delivery target:** 7--8 days\
> **Primary stack:** React, Tailwind CSS, Node.js, Express, PostgreSQL,
> Prisma 7\
> **Team:** 2 consistently active developers + 1 supporting developer

------------------------------------------------------------------------

## 1. Executive Summary

Udaan is a school-level student retention platform that helps educators
identify students who may be experiencing barriers to continuing their
education and coordinate timely, documented support.

The MVP combines four of the problem statement's ideas into one
connected workflow:

1.  **AI-driven early warning (MVP implementation: transparent
    rule-based risk assessment):** calculate risk indicators from
    attendance, academic performance and recorded support needs.
2.  **Student support and engagement:** record teacher-led
    interventions, assign follow-up dates and monitor outcomes.
3.  **Parental engagement (limited MVP foundation):** maintain guardian
    contact details and record communication attempts; a full parent
    portal is deferred.
4.  **Financial support management (limited MVP foundation):** capture a
    reported financial-barrier indicator and notes for human follow-up;
    scholarship discovery and disbursement are deferred.

Student, teacher, attendance and academic records are the foundation
that makes the early-warning and intervention workflow possible.
Community learning hubs, a mobile learning application and flexible
schooling management are valuable future modules, but they are too broad
to implement credibly in the initial 7--8 days.

**Important product principle:** a risk score is a review signal, not a
diagnosis or a prediction of a student's future. The platform must show
the factors behind every flag and require a human educator to review the
case before action is taken.

## 2. Problem Analysis

### 2.1 Problem

Student dropout is associated with interacting educational, social and
economic barriers. Schools may have attendance registers, marks and
informal knowledge about a student's circumstances, but those signals
can be fragmented across notebooks, spreadsheets and staff members.

This creates operational problems:

-   Patterns such as repeated absence or declining performance may be
    noticed late.
-   Staff may not have one place to review relevant indicators.
-   Follow-up actions can be informal and difficult to track.
-   A school may not know whether an intervention was completed or
    whether the student's situation improved.
-   Financial, access or family-related barriers may not be connected to
    academic support workflows.

### 2.2 Product opportunity

Udaan connects a small set of existing school records to a repeatable
response process:

**Observe → Flag → Review → Support → Follow up → Reassess**

The product does not claim to solve structural poverty, transport access
or school capacity through software alone. It helps schools notice
concerns earlier, coordinate their response and retain a record of what
happened.

### 2.3 Product goals

-   Make student attendance and academic information easy to maintain.
-   Surface students whose recorded indicators warrant human review.
-   Explain why a student appears in a risk category.
-   Make interventions actionable, owned and time-bound.
-   Show whether indicators improve after support.
-   Protect sensitive student information through role and school
    boundaries.

### 2.4 Non-goals for the MVP

-   Automated dropout prediction trained on historical datasets.
-   Automated decisions about enrolment, discipline, eligibility or
    access to education.
-   Parent/student self-service portals.
-   Native Android/iOS application.
-   Live video classes, tutoring marketplace or community forums.
-   Scholarship search, application submission or fund disbursement.
-   Integration with government school systems or identity providers.
-   District/state-wide analytics across institutions.
-   Automated SMS, WhatsApp or email delivery.

## 3. Product Overview

### 3.1 Product vision

Make early student support a practical, explainable and trackable part
of everyday school operations.

### 3.2 Suggested names

  Name          Positioning
  ------------- -------------------------------------------------
  Udaan         Positive, accessible student-retention identity
  ShikshaSetu   Connects school signals with support
  Pathway       Focuses on continuity in education
  Saathi        Emphasizes human support and follow-up

Use **Udaan** as the working name. Check name availability before public
release.

### 3.3 Target users and stakeholders

-   **School administrator:** configures the school, accounts and
    school-level records.
-   **Principal/management:** reviews school-wide risk and intervention
    summaries.
-   **Teacher:** records attendance and marks, reviews assigned students
    and creates interventions.
-   **Student:** future role for viewing goals, learning resources and
    support information.
-   **Parent/guardian:** future role for receiving progress updates and
    communicating with teachers.
-   **District/education officials:** future aggregate reporting,
    subject to lawful authorization and privacy controls.

### 3.4 Expected social impact

The MVP can demonstrate operational improvements, not prove a reduction
in dropout rates within eight days. Appropriate early measures include:

-   Time between a concerning attendance pattern and staff review.
-   Percentage of flagged students with a documented human review.
-   Percentage of interventions with an owner and due date.
-   Follow-up completion rate.
-   Attendance change in the period after an intervention.
-   Number of unresolved cases past their follow-up date.

Do not present these as proof of causal dropout reduction. Long-term
impact requires deployment, longitudinal data and evaluation.

### 3.5 NEP 2020 alignment

The platform supports the broad objectives stated in the problem
statement: improving access, equity, quality and continuity of
education, and supporting retention through timely attention to
barriers. It is a supporting school tool, not a claim of official NEP
certification or government integration.

## 4. Scope and Prioritization

### P0 --- required for the MVP

  -----------------------------------------------------------------------
  Module                  P0 capability           Why it is essential
  ----------------------- ----------------------- -----------------------
  Authentication and      Login, password         Protects student data
  access                  hashing, roles, school  
                          isolation               

  School and user setup   One seeded/demo school, Makes the workflow
                          administrator and       usable
                          teacher accounts; admin 
                          CRUD for staff          

  Student management      Create, list, view,     Core student record
                          update, deactivate      
                          students; guardian      
                          contact fields          

  Attendance              Record daily            Primary early-warning
                          attendance; view by     signal
                          date/student; calculate 
                          attendance percentage   
                          and absence streak      

  Academic performance    Record assessment       Second early-warning
                          marks; view history and signal
                          identify declining      
                          trend                   

  Risk assessment         Deterministic score,    Core differentiator
                          category, reasons,      
                          missing-data state      

  Intervention tracking   Create, assign, update  Converts alerts into
                          status, add             action
                          outcome/follow-up       

  Dashboard               Database-derived        Makes the workflow
                          counts, risk list,      visible
                          overdue follow-ups      

  Demo data               Seed realistic records  Supports a credible
                                                  demonstration
  -----------------------------------------------------------------------

### P1 --- implement only if P0 is stable

-   CSV import/export for student lists.
-   Guardian communication log.
-   Financial-barrier follow-up field and referral notes.
-   Filters by class, risk category and intervention status.
-   Simple printable student case summary.
-   Basic audit log for sensitive record changes.

### P2 --- future roadmap

-   Full parent and student portals.
-   Scholarship discovery and application workflow.
-   Counselling appointment scheduling and protected counselling
    records.
-   Learning resources, tutoring and community hubs.
-   Offline-first mobile learning.
-   Flexible schooling and alternative schedules.
-   SMS/WhatsApp/email notifications.
-   Government/district integrations.
-   Validated statistical or machine-learning risk models.

**Scope guardrail:** if a P0 workflow is incomplete, do not start a P1
module.

## 5. User Roles and Permissions

Use role-based access control (RBAC), with school scoping applied in
every relevant query. For the MVP, users belong to one school. A
platform administrator may manage schools, but ordinary school users
must never query another school's records.

  --------------------------------------------------------------------------------------------
  Capability          Platform School admin   Principal          Teacher    Student     Parent
                         admin                                                      
  --------------- ------------ ------------ ----------- ---------------- ---------- ----------
  Manage schools           Yes           No          No               No         No         No

  Manage school        Support          Yes        View               No         No         No
  users                                                                             

  View school          Support          Yes         Yes   Assigned/class        Own     Linked
  dashboard                                                        scope   summary,     child,
                                                                             future     future

  Create/update        Support          Yes       Yes\* Assigned scope\*         No         No
  students                                                                          

  Record                    No          Yes         Yes Assigned classes         No         No
  attendance                                                                        

  Record marks              No          Yes         Yes Assigned classes         No         No

  View risk            Support          Yes         Yes         Assigned        Own     Linked
  reasons                                                       students   summary,     child,
                                                                             future     future

  Create                    No          Yes         Yes         Assigned         No         No
  interventions                                                 students            

  Update                    No          Yes         Yes     Own/assigned         No         No
  intervention                                                                      

  Delete records    Restricted   Deactivate          No               No         No         No
                                  preferred                                         
  --------------------------------------------------------------------------------------------

\*School policy may restrict principal/teacher write permissions. For
the MVP, enforce: school admin can manage all students; teacher can view
and update records only for assigned classes; principal can view all
school records and create interventions. If class assignment is not
implemented by Day 3, use a clearly documented teacher-to-student
assignment table or temporarily limit teacher access to explicitly
assigned students.

### Data access rules

-   Every school-owned table includes `schoolId` directly or is
    reachable through a school-owned parent.
-   Derive `schoolId` from the authenticated user, never trust a
    client-supplied school ID.
-   Fetch by both record ID and authorized school scope,
    e.g. `where: { id, schoolId }`.
-   A `404` response for out-of-scope records avoids confirming another
    school's record exists.
-   Platform-admin cross-school access must be explicit and audited.
-   Students/parents are future roles; do not expose their routes until
    identity-linking and consent rules exist.

## 6. Core Functional Requirements

### 6.1 Authentication and account management

**Users:** all staff roles.

Requirements: - Login with email and password. - Store only a bcrypt
password hash. - Issue a signed JWT with user ID, role and school ID. -
Protect API routes with authentication middleware. - Enforce role and
school scope in authorization/service logic. - Admin can create, view,
update and deactivate school staff. - Do not provide public
self-registration in the MVP.

Acceptance: - Invalid credentials return a generic `401`. - Disabled
users cannot log in. - A teacher cannot access admin endpoints. - A user
from School A cannot read School B records by changing an ID.

### 6.2 Student management

**Users:** school admin, principal, authorized teacher.

Fields: - Admission/student code, full name, date of birth (optional for
demo), grade/class, section, enrolment status, admission date. -
Guardian name, phone and relationship (minimum necessary contact
information). - Optional support flags: financial barrier reported,
accessibility/support need reported, notes for authorized staff.

Requirements: - Create, list, view and update student. - Deactivate
rather than hard-delete a student with attendance/marks/interventions. -
Search by name or student code; filter by class/status. - Validate
unique student code within a school. - Do not collect sensitive family
details unless operationally necessary.

### 6.3 Attendance management

**Users:** school admin, principal, assigned teacher.

Requirements: - Record attendance for a date and student as `PRESENT`,
`ABSENT`, `LATE` or `EXCUSED`. - Prevent duplicate attendance for the
same student and date. - Bulk entry for a class is a useful P1; P0 may
record students individually or through a simple class grid. - View
attendance history and summary. - Calculate attendance percentage using
recorded school days in the selected period; exclude excused days from
the denominator if that is the school's declared policy. Document the
chosen policy. - Calculate consecutive absence days from the latest
recorded school days, not calendar days. - Do not interpret missing
attendance records as absences.

### 6.4 Academic performance

**Users:** school admin, principal, assigned teacher.

Requirements: - Create an assessment with title, subject, date, maximum
marks and class/grade. - Record a student's score for an assessment. -
Validate `0 <= score <= maxMarks`. - Show normalized percentage and
recent performance history. - Declining trend: compare the latest two
valid assessment percentages for the same student and subject. Mark as
declining when the latest is at least 10 percentage points below the
previous result. This is a configurable MVP heuristic, not a universal
academic standard. - Avoid comparing different subjects or incompatible
assessment scales without normalization.

### 6.5 Early-warning and risk assessment

**Users:** principal, school admin, authorized teacher.

Requirements: - Calculate risk from available indicators. - Store the
latest score, category, calculation time, reasons and data
completeness. - Recalculate when relevant attendance, marks or
support-flag data changes, and provide a manual refresh endpoint. -
Display factors that contributed to the score. - Missing data must be
shown as "insufficient data"; it must not be silently treated as good
performance. - Human reviewer can mark a case reviewed and create an
intervention. - Risk status alone must never trigger punitive or
exclusionary action.

### 6.6 Intervention tracking

**Users:** principal, school admin, assigned teacher.

Fields: - Student, concern category, description, action plan, assigned
staff member, priority, status, due date, outcome and follow-up date. -
Status: `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. - Concern
categories: `ATTENDANCE`, `ACADEMIC`, `FINANCIAL`, `ACCESSIBILITY`,
`FAMILY`, `OTHER`. - Record creation and update timestamps.

Requirements: - Create, list, view and update interventions. - Assign an
owner. - Record review notes and outcome. - Show overdue follow-ups. -
Keep intervention history; do not overwrite the risk reasons that
originally prompted the intervention. - Avoid exposing sensitive
counselling notes in general dashboards.

### 6.7 Dashboard and reporting

Dashboard metrics must come from PostgreSQL queries, not hardcoded
values: - Active students. - Attendance rate for a selected period. -
Students by current risk category. - Open interventions. - Overdue
follow-ups. - Recently flagged students and their top risk reasons.

Use clear labels, date ranges and empty states. Explain the denominator
for attendance rate.

## 7. Risk Assessment Specification

### 7.1 Inputs and storage

  -----------------------------------------------------------------------
  Indicator               Source                  MVP calculation
  ----------------------- ----------------------- -----------------------
  Attendance percentage   Attendance records      Present + late divided
                                                  by eligible recorded
                                                  school days, per
                                                  declared policy

  Consecutive absences    Attendance records      Consecutive `ABSENT`
                                                  school days ending at
                                                  latest recorded school
                                                  day

  Academic decline        Assessment records      Latest same-subject
                                                  percentage compared
                                                  with previous
                                                  same-subject percentage

  Financial barrier       Student support flag    Staff-reported boolean;
                                                  optional note with
                                                  restricted access

  Unresolved intervention Intervention records    Open/in-progress
                                                  intervention past due
                                                  date, or unresolved
                                                  high-priority case
  -----------------------------------------------------------------------

### 7.2 Proposed transparent score (0--100)

This is a prioritization heuristic for the prototype. It is not
statistically validated and must be calibrated with educators before
real deployment.

  -----------------------------------------------------------------------
  Rule                                                             Points
  ------------------------------ ----------------------------------------
  Attendance below 75%                                                +30

  Attendance from 75% to below                                        +15
  85%                            

  3--4 consecutive absent school                                      +15
  days                           

  5 or more consecutive absent                         +25 instead of +15
  school days                    

  Academic decline of 10--19.99                                       +10
  percentage points              

  Academic decline of 20 or more                       +20 instead of +10
  percentage points              

  Financial barrier reported                                          +10

  Overdue unresolved                                                  +10
  intervention                   

  **Maximum**                                                     **100**
  -----------------------------------------------------------------------

Rules within the same indicator are mutually exclusive. Do not add both
attendance bands or both absence-streak bands. Clamp total to 100.

### 7.3 Risk categories

  ------------------------------------------------------------------------
                         Score Category              Meaning
  ---------------------------- --------------------- ---------------------
                         0--24 LOW                   No current
                                                     combination of
                                                     configured indicators
                                                     warrants elevated
                                                     flag

                        25--49 MEDIUM                Staff review and
                                                     monitoring
                                                     recommended

                       50--100 HIGH                  Prompt human review
                                                     and support planning
                                                     recommended
  ------------------------------------------------------------------------

**Insufficient data rule:** if there are fewer than 10 eligible recorded
school days, or no usable academic record, display a data-completeness
warning. A provisional score may be calculated from available
indicators, but the dashboard must label it `PROVISIONAL` and must not
classify missing inputs as zero-risk. If no usable indicator exists,
return `INSUFFICIENT_DATA`, not LOW.

### 7.4 Explainability output

Example response:

``` json
{
  "score": 65,
  "category": "HIGH",
  "dataStatus": "PROVISIONAL",
  "reasons": [
    { "code": "LOW_ATTENDANCE", "label": "Attendance is 68%", "points": 30 },
    { "code": "ABSENCE_STREAK", "label": "5 consecutive absent school days", "points": 25 },
    { "code": "FINANCIAL_BARRIER", "label": "A financial barrier was reported", "points": 10 }
  ],
  "calculatedAt": "2026-11-06T08:00:00.000Z",
  "humanReviewRequired": true
}
```

### 7.5 Algorithm pseudocode

``` js
function calculateRisk(indicators) {
  let score = 0;
  const reasons = [];

  if (indicators.attendancePercentage !== null) {
    if (indicators.attendancePercentage < 75) {
      score += 30;
      reasons.push(reason("LOW_ATTENDANCE", 30));
    } else if (indicators.attendancePercentage < 85) {
      score += 15;
      reasons.push(reason("MODERATE_ATTENDANCE", 15));
    }
  }

  if (indicators.consecutiveAbsences >= 5) {
    score += 25;
    reasons.push(reason("ABSENCE_STREAK_5_PLUS", 25));
  } else if (indicators.consecutiveAbsences >= 3) {
    score += 15;
    reasons.push(reason("ABSENCE_STREAK_3_4", 15));
  }

  if (indicators.academicDrop !== null) {
    if (indicators.academicDrop >= 20) {
      score += 20;
      reasons.push(reason("ACADEMIC_DECLINE_20_PLUS", 20));
    } else if (indicators.academicDrop >= 10) {
      score += 10;
      reasons.push(reason("ACADEMIC_DECLINE_10_PLUS", 10));
    }
  }

  if (indicators.financialBarrierReported) {
    score += 10;
    reasons.push(reason("FINANCIAL_BARRIER", 10));
  }

  if (indicators.overdueIntervention) {
    score += 10;
    reasons.push(reason("OVERDUE_INTERVENTION", 10));
  }

  score = Math.min(score, 100);
  const usableSignals = indicators.usableSignalCount;
  const dataStatus = usableSignals === 0 ? "INSUFFICIENT_DATA"
    : indicators.eligibleSchoolDays < 10 || indicators.hasNoAcademicData
      ? "PROVISIONAL" : "COMPLETE";

  const category = dataStatus === "INSUFFICIENT_DATA" ? "INSUFFICIENT_DATA"
    : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

  return { score, category, dataStatus, reasons, humanReviewRequired: true };
}
```

Adapt the exact function to the project's service structure. The
algorithm should be unit-tested independently from Express routes.

### 7.6 Safeguards and fairness

-   Show score, date, data status and reasons together.
-   Allow authorized staff to correct source records.
-   Do not use caste, religion, disability diagnosis, gender, or other
    protected/sensitive attributes as negative scoring features.
-   A reported financial or access barrier should trigger support, not
    blame.
-   Restrict notes to staff with a legitimate need to know.
-   Provide a way to mark a flag reviewed and document context.
-   Keep a record of score snapshots for intervention evaluation if time
    allows; for MVP, store latest score and reason JSON.
-   Before real deployment, conduct educator review, privacy review,
    bias assessment and threshold calibration.

## 8. Database Design --- PostgreSQL + Prisma 7

### 8.1 Design principles

-   Use UUID primary keys.
-   Use `createdAt` and `updatedAt` timestamps.
-   Use enums for controlled states.
-   Use unique constraints scoped to a school where appropriate.
-   Prefer deactivation/status over deleting records referenced by
    historical data.
-   Store risk reasons as JSON for the MVP, while keeping core entities
    relational.
-   Store passwords as hashes only.
-   Use database constraints and server-side validation together.

### 8.2 Core models

The following is a logical schema. Confirm Prisma 7
generator/configuration syntax against the project's installed version
and existing `prisma.config.ts`; do not copy configuration from an older
Prisma release blindly.

``` prisma
enum UserRole {
  PLATFORM_ADMIN
  SCHOOL_ADMIN
  PRINCIPAL
  TEACHER
}

enum StudentStatus {
  ACTIVE
  INACTIVE
  TRANSFERRED
  COMPLETED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

enum InterventionStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum InterventionPriority {
  LOW
  MEDIUM
  HIGH
}

enum ConcernCategory {
  ATTENDANCE
  ACADEMIC
  FINANCIAL
  ACCESSIBILITY
  FAMILY
  OTHER
}

enum RiskCategory {
  LOW
  MEDIUM
  HIGH
  INSUFFICIENT_DATA
}

model School {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  code      String   @unique
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  users     User[]
  classes   SchoolClass[]
  students  Student[]
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  schoolId     String?  @db.Uuid
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  school       School?  @relation(fields: [schoolId], references: [id])
  assignedStudents Student[] @relation("StudentTeacher")
  attendanceCreated Attendance[] @relation("AttendanceRecorder")
  marksCreated StudentMark[] @relation("MarkRecorder")
  interventionsAssigned Intervention[] @relation("InterventionOwner")
  interventionsCreated Intervention[] @relation("InterventionCreator")
}

model SchoolClass {
  id        String   @id @default(uuid()) @db.Uuid
  schoolId  String   @db.Uuid
  name      String
  section   String?
  grade     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  school    School   @relation(fields: [schoolId], references: [id])
  students  Student[]
  @@unique([schoolId, grade, name, section])
}

model Student {
  id                       String        @id @default(uuid()) @db.Uuid
  schoolId                 String        @db.Uuid
  classId                  String?       @db.Uuid
  assignedTeacherId        String?       @db.Uuid
  studentCode              String
  fullName                 String
  dateOfBirth              DateTime?
  guardianName             String?
  guardianPhone            String?
  guardianRelationship     String?
  financialBarrierReported Boolean       @default(false)
  supportNotes             String?
  status                   StudentStatus @default(ACTIVE)
  admissionDate            DateTime?
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
  school                   School        @relation(fields: [schoolId], references: [id])
  schoolClass              SchoolClass?  @relation(fields: [classId], references: [id])
  assignedTeacher          User?         @relation("StudentTeacher", fields: [assignedTeacherId], references: [id])
  attendance               Attendance[]
  marks                    StudentMark[]
  riskAssessment           RiskAssessment?
  interventions            Intervention[]
  @@unique([schoolId, studentCode])
  @@index([schoolId, status])
  @@index([classId])
}

model Attendance {
  id          String           @id @default(uuid()) @db.Uuid
  schoolId    String           @db.Uuid
  studentId   String           @db.Uuid
  date        DateTime         @db.Date
  status      AttendanceStatus
  note        String?
  recordedById String          @db.Uuid
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  student     Student          @relation(fields: [studentId], references: [id])
  recordedBy  User             @relation("AttendanceRecorder", fields: [recordedById], references: [id])
  @@unique([studentId, date])
  @@index([schoolId, date])
  @@index([studentId, date])
}

model Assessment {
  id          String   @id @default(uuid()) @db.Uuid
  schoolId    String   @db.Uuid
  classId     String?  @db.Uuid
  title       String
  subject     String
  assessmentDate DateTime
  maxMarks    Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  marks       StudentMark[]
  @@index([schoolId, assessmentDate])
}

model StudentMark {
  id           String     @id @default(uuid()) @db.Uuid
  schoolId     String     @db.Uuid
  studentId    String     @db.Uuid
  assessmentId String     @db.Uuid
  score        Float
  recordedById String     @db.Uuid
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  student      Student    @relation(fields: [studentId], references: [id])
  assessment   Assessment @relation(fields: [assessmentId], references: [id])
  recordedBy   User       @relation("MarkRecorder", fields: [recordedById], references: [id])
  @@unique([studentId, assessmentId])
  @@index([schoolId, studentId])
}

model RiskAssessment {
  id             String       @id @default(uuid()) @db.Uuid
  schoolId       String       @db.Uuid
  studentId      String       @unique @db.Uuid
  score          Int
  category       RiskCategory
  dataStatus     String
  reasons        Json
  calculatedAt   DateTime     @default(now())
  student        Student      @relation(fields: [studentId], references: [id])
  @@index([schoolId, category, score])
}

model Intervention {
  id             String                @id @default(uuid()) @db.Uuid
  schoolId       String                @db.Uuid
  studentId      String                @db.Uuid
  createdById    String                @db.Uuid
  assignedToId   String?               @db.Uuid
  category       ConcernCategory
  priority       InterventionPriority  @default(MEDIUM)
  status         InterventionStatus   @default(OPEN)
  description    String
  actionPlan     String?
  dueDate        DateTime?
  followUpDate   DateTime?
  outcome        String?
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt
  student        Student               @relation(fields: [studentId], references: [id])
  createdBy      User                  @relation("InterventionCreator", fields: [createdById], references: [id])
  assignedTo     User?                 @relation("InterventionOwner", fields: [assignedToId], references: [id])
  @@index([schoolId, status, dueDate])
  @@index([studentId, createdAt])
}
```

**Implementation notes:** 1. Add composite foreign-key enforcement or
equivalent service validation so `studentId`, `classId`, `assessmentId`,
assigned teacher and user references belong to the same school. The
simple Prisma relations above do not by themselves guarantee all
cross-record school IDs match. 2. `Assessment` should have a relation to
`SchoolClass` if class-level assessments are implemented; add the
`SchoolClass` relation fields and validate the class belongs to the same
school. 3. If using a `schoolId` on child tables for query efficiency,
populate it from the parent record on the server and validate
consistency. 4. `User.schoolId` is nullable only for a platform admin.
All school staff must have a school. 5. If time is short, omit
`SchoolClass` and use `grade`/`section` fields on Student; do not omit
school isolation or the core attendance/risk/intervention relations. 6.
For historical risk tracking, a future `RiskAssessmentSnapshot` table
should replace the single current assessment model.

### 8.3 Relationship summary

-   School 1 → many Users.
-   School 1 → many Classes.
-   School 1 → many Students.
-   Class 1 → many Students.
-   Teacher 1 → many assigned Students (logical one-to-many).
-   Student 1 → many Attendance records.
-   Student 1 → many StudentMark records.
-   Assessment 1 → many StudentMark records.
-   Student 1 → one current RiskAssessment.
-   Student 1 → many Interventions.
-   User 1 → many created/assigned Interventions.

The Student--Assessment relationship is many-to-many through
`StudentMark`. The student/assessment unique constraint prevents
duplicate marks for the same assessment.

### 8.4 Mermaid ER diagram

``` mermaid
erDiagram
  SCHOOL ||--o{ USER : has
  SCHOOL ||--o{ SCHOOL_CLASS : contains
  SCHOOL ||--o{ STUDENT : enrolls
  SCHOOL_CLASS ||--o{ STUDENT : groups
  USER o|--o{ STUDENT : teaches
  STUDENT ||--o{ ATTENDANCE : has
  USER ||--o{ ATTENDANCE : records
  STUDENT ||--o{ STUDENT_MARK : receives
  ASSESSMENT ||--o{ STUDENT_MARK : includes
  STUDENT ||--o| RISK_ASSESSMENT : assessed_by
  STUDENT ||--o{ INTERVENTION : receives
  USER ||--o{ INTERVENTION : creates
  USER o|--o{ INTERVENTION : owns
```

## 9. Backend Architecture

### 9.1 Folder structure

``` text
server/
  prisma/
    schema.prisma
    migrations/
    seed.js
  src/
    config/
      env.js
      prisma.js
    middleware/
      authenticate.js
      authorize.js
      validate.js
      errorHandler.js
      notFound.js
    routes/
      auth.routes.js
      users.routes.js
      students.routes.js
      attendance.routes.js
      assessments.routes.js
      marks.routes.js
      risk.routes.js
      interventions.routes.js
      dashboard.routes.js
    controllers/
      auth.controller.js
      students.controller.js
      attendance.controller.js
      assessments.controller.js
      marks.controller.js
      risk.controller.js
      interventions.controller.js
      dashboard.controller.js
    services/
      auth.service.js
      student.service.js
      attendance.service.js
      academic.service.js
      risk.service.js
      intervention.service.js
      dashboard.service.js
    validators/
      student.validator.js
      attendance.validator.js
      assessment.validator.js
      intervention.validator.js
    utils/
      AppError.js
      asyncHandler.js
    app.js
    server.js
  package.json
  .env.example
```

Keep controllers thin: parse request, call service, return response. Put
authorization-aware queries and business rules in services. Use CommonJS
(`require`, `module.exports`) throughout the backend.

### 9.2 Suggested dependencies

  -----------------------------------------------------------------------
  Package                 Purpose                 Required?
  ----------------------- ----------------------- -----------------------
  express                 HTTP server             Yes

  @prisma/client, prisma  Prisma 7 + PostgreSQL   Yes, align with
  7, pg,                  integration             installed setup
  @prisma/adapter-pg,                             
  dotenv                                          

  bcryptjs                Password hashing        Yes
                          without native build    
                          friction                

  jsonwebtoken            JWT                     Yes
                          creation/verification   

  zod                     Request validation      Recommended

  cors                    Restrict browser        Yes for separate dev
                          origins                 origins

  helmet                  Basic security headers  Recommended

  express-rate-limit      Slow repeated login     Recommended
                          attempts                

  morgan                  Development request     Optional
                          logs                    

  nodemon                 Development reload      Optional
  -----------------------------------------------------------------------

Do not add Redis, queues, microservices, GraphQL or an AI framework.

### 9.3 Prisma 7 integration note

Prisma 7 configuration differs from older tutorials. Preserve the
project's generated-client output, adapter and `prisma.config.ts`
conventions. Initialize the PostgreSQL adapter once in
`config/prisma.js`, export a singleton client, and disconnect cleanly on
process shutdown. Use migrations for schema changes; do not rely on
`db push` as the team's final migration workflow.

### 9.4 Middleware order

1.  Load environment variables.
2.  Security headers and CORS.
3.  JSON body parser with a reasonable size limit.
4.  Request logging in development.
5.  Route handlers.
6.  Not-found handler.
7.  Central error handler.

Authentication middleware verifies the JWT and loads/attaches the active
user context. Authorization middleware checks role. Service methods
enforce school scope and record ownership.

## 10. REST API Specification

Base path: `/api/v1`. All protected endpoints require
`Authorization: Bearer <token>`. JSON responses should use a consistent
envelope:

``` json
{ "success": true, "data": {}, "message": "Optional message" }
```

Errors:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

### 10.1 Authentication and users

  -------------------------------------------------------------------------------
  Method            Route                 Purpose               Roles
  ----------------- --------------------- --------------------- -----------------
  POST              `/auth/login`         Authenticate and      Public
                                          return token/user     

  GET               `/auth/me`            Current user profile  All authenticated

  POST              `/users`              Create school staff   School admin
                                          account               

  GET               `/users`              List staff in own     School admin,
                                          school                principal

  GET               `/users/:id`          View staff member     School admin,
                                                                principal

  PATCH             `/users/:id`          Update staff          School admin
                                          profile/role          

  PATCH             `/users/:id/status`   Activate/deactivate   School admin
                                          staff                 
  -------------------------------------------------------------------------------

Login body: `{ "email": "...", "password": "..." }`. Never return
`passwordHash`.

### 10.2 Students

  -----------------------------------------------------------------------------------
  Method            Route                     Purpose               Roles
  ----------------- ------------------------- --------------------- -----------------
  POST              `/students`               Create student        School admin,
                                                                    principal

  GET               `/students`               List/search/filter    School admin,
                                              students              principal,
                                                                    teacher (assigned
                                                                    scope)

  GET               `/students/:id`           Student details       Authorized school
                                                                    staff

  PATCH             `/students/:id`           Update student        School admin,
                                                                    principal;
                                                                    teacher limited

  PATCH             `/students/:id/status`    Deactivate/transfer   School admin
                                              student               

  GET               `/students/:id/summary`   Attendance, marks,    Authorized school
                                              risk, interventions   staff
  -----------------------------------------------------------------------------------

List query: `?search=riya&classId=...&status=ACTIVE&page=1&limit=20`.

Create body example:

``` json
{
  "studentCode": "UDN-0101",
  "fullName": "Riya Patil",
  "grade": "8",
  "section": "A",
  "guardianName": "Anita Patil",
  "guardianPhone": "9000000000",
  "financialBarrierReported": false
}
```

### 10.3 Attendance

  -------------------------------------------------------------------------------------------
  Method            Route                              Purpose              Roles
  ----------------- ---------------------------------- -------------------- -----------------
  POST              `/attendance`                      Record one           School admin,
                                                       attendance entry     principal,
                                                                            assigned teacher

  GET               `/attendance`                      List by              Authorized school
                                                       date/student/class   staff

  GET               `/attendance/student/:studentId`   Student attendance   Authorized school
                                                       history/summary      staff

  PATCH             `/attendance/:id`                  Correct an entry     School admin,
                                                                            principal;
                                                                            original recorder
                                                                            if policy permits

  DELETE            `/attendance/:id`                  Remove erroneous     School admin only
                                                       entry with           
                                                       audit/reason         
  -------------------------------------------------------------------------------------------

Create body:
`{ "studentId": "...", "date": "2026-11-06", "status": "ABSENT", "note": "" }`.

Return `409` for duplicate student/date attendance.

### 10.4 Assessments and marks

  --------------------------------------------------------------------------
  Method            Route                Purpose           Roles
  ----------------- -------------------- ----------------- -----------------
  POST              `/assessments`       Create assessment School admin,
                                                           principal,
                                                           teacher

  GET               `/assessments`       List assessments  Authorized school
                                                           staff

  GET               `/assessments/:id`   Assessment and    Authorized school
                                         marks             staff

  PATCH             `/assessments/:id`   Update assessment Creator, school
                                         metadata          admin

  DELETE            `/assessments/:id`   Delete assessment School admin
                                         if no dependent   
                                         marks, otherwise  
                                         archive policy    

  POST              `/marks`             Record student's  School admin,
                                         assessment score  principal,
                                                           teacher

  GET               `/marks`             Query marks       Authorized school
                                                           staff

  PATCH             `/marks/:id`         Correct score     School admin,
                                                           principal,
                                                           authorized
                                                           teacher

  DELETE            `/marks/:id`         Remove erroneous  School admin
                                         mark              
  --------------------------------------------------------------------------

Validate score against assessment maximum marks and confirm student,
assessment and actor share the same school.

### 10.5 Risk

  ---------------------------------------------------------------------------------------
  Method            Route                            Purpose            Roles
  ----------------- -------------------------------- ------------------ -----------------
  POST              `/risk/recalculate/:studentId`   Recalculate one    School admin,
                                                     student's risk     principal,
                                                                        authorized
                                                                        teacher

  POST              `/risk/recalculate`              Recalculate all    School admin,
                                                     active students    principal
                                                     (limit/paginate)   

  GET               `/risk`                          List risk          School admin,
                                                     assessments with   principal,
                                                     filters            teacher (assigned
                                                                        scope)

  GET               `/risk/:studentId`               Risk details and   Authorized school
                                                     reasons            staff
  ---------------------------------------------------------------------------------------

Filters: `?category=HIGH&classId=...&dataStatus=COMPLETE`. Risk
recalculation should use a transaction where it updates source-derived
data and the current assessment.

### 10.6 Interventions

  ---------------------------------------------------------------------------------------
  Method            Route                         Purpose               Roles
  ----------------- ----------------------------- --------------------- -----------------
  POST              `/interventions`              Create intervention   School admin,
                                                                        principal,
                                                                        assigned teacher

  GET               `/interventions`              List/filter           Authorized school
                                                  interventions         staff

  GET               `/interventions/:id`          View intervention     Authorized school
                                                                        staff

  PATCH             `/interventions/:id`          Update                Creator, owner,
                                                  plan/status/outcome   school admin,
                                                                        principal

  PATCH             `/interventions/:id/status`   Change status         Creator, owner,
                                                                        school admin,
                                                                        principal

  DELETE            `/interventions/:id`          Cancel/archive; avoid School admin
                                                  hard deletion         
  ---------------------------------------------------------------------------------------

### 10.7 Dashboard

  -------------------------------------------------------------------------------
  Method            Route                    Purpose            Roles
  ----------------- ------------------------ ------------------ -----------------
  GET               `/dashboard/overview`    School-level       School admin,
                                             counts and rates   principal

  GET               `/dashboard/teacher`     Assigned-student   Teacher
                                             summary            

  GET               `/dashboard/attention`   High/medium risk   Authorized school
                                             and overdue cases  staff
  -------------------------------------------------------------------------------

### 10.8 Standard status codes

-   `200` successful read/update.
-   `201` created.
-   `400` malformed request.
-   `401` missing/invalid authentication.
-   `403` authenticated but role not allowed.
-   `404` missing or out-of-scope record.
-   `409` duplicate/conflicting record.
-   `422` valid JSON but invalid business data.
-   `500` unexpected server error.

## 11. Frontend Architecture

### 11.1 Folder structure

``` text
client/
  src/
    api/
      client.js
      auth.api.js
      students.api.js
      attendance.api.js
      academics.api.js
      risk.api.js
      interventions.api.js
      dashboard.api.js
    components/
      layout/
        AppShell.jsx
        Sidebar.jsx
        Topbar.jsx
      common/
        Button.jsx
        Input.jsx
        Select.jsx
        Modal.jsx
        DataTable.jsx
        StatusBadge.jsx
        EmptyState.jsx
        LoadingState.jsx
        ErrorState.jsx
      students/
        StudentForm.jsx
        StudentFilters.jsx
      attendance/
        AttendanceForm.jsx
      risk/
        RiskBadge.jsx
        RiskReasons.jsx
      interventions/
        InterventionForm.jsx
    pages/
      LoginPage.jsx
      DashboardPage.jsx
      StudentsPage.jsx
      StudentDetailPage.jsx
      AttendancePage.jsx
      AcademicsPage.jsx
      RiskPage.jsx
      InterventionsPage.jsx
      NotFoundPage.jsx
    context/
      AuthContext.jsx
    hooks/
      useAuth.js
    utils/
      formatters.js
      permissions.js
    App.jsx
    main.jsx
```

### 11.2 Pages and navigation

  -----------------------------------------------------------------------
  Page                                Main content
  ----------------------------------- -----------------------------------
  Login                               Staff login

  Overview dashboard                  Database-backed school KPIs, risk
                                      distribution, follow-ups

  Students                            Searchable student table,
                                      add/edit/deactivate

  Student detail                      Profile, attendance summary, marks,
                                      risk reasons, interventions

  Attendance                          Date/class selector and attendance
                                      entry/history

  Academics                           Assessment creation and mark entry

  At-risk students                    Risk category, score, reasons, data
                                      completeness and filters

  Interventions                       Open/in-progress/completed lists,
                                      due dates and outcomes
  -----------------------------------------------------------------------

Navigation should be role-aware. Do not show controls that the user's
role cannot use. The backend remains the authority; hiding a button is
not authorization.

### 11.3 UI states

Every data page must implement: - Loading state. - Empty state with a
clear next action. - Error state with retry. - Form validation
messages. - Success feedback. - Disabled submit state while saving. -
Responsive layout for laptop and mobile widths.

### 11.4 Visual direction

Use a calm, trustworthy education-oriented interface. Prefer a
restrained palette, clear typography, readable tables and obvious status
labels. Avoid excessive gradients, dense cards and decorative charts.
Prioritize the student case workflow over visual effects.

### 11.5 API integration

Use one configured API client that attaches the JWT and handles `401`
consistently. Keep API functions separate from page components. Do not
store sensitive student notes in local storage. If using local storage
for a demo token, document the trade-off; an HTTP-only secure cookie is
preferable for production.

## 12. Authentication, Security and Privacy

Minimum requirements: - Hash passwords with bcrypt/bcryptjs; never store
or log plaintext passwords. - Use a strong JWT secret from environment
variables; set expiry. - Validate all request bodies, params and query
strings. - Use role checks and school-scoped service queries. - Use
HTTPS in deployment. - Restrict CORS to the deployed frontend origin. -
Use Helmet and login rate limiting. - Keep secrets out of Git; commit
`.env.example`, not `.env`. - Avoid returning guardian phone numbers or
support notes in list endpoints unless needed. - Log security-relevant
events without logging passwords, tokens or sensitive notes. - Use soft
deactivation for important records. - Back up the database before a real
deployment. - Establish retention, access, correction and deletion
policies before collecting real student data.

**Production caution:** this is a prototype blueprint, not a legal
compliance assessment. Before handling real minors' data, obtain
institutional authorization and review applicable Indian privacy,
child-data, education-record and security requirements with qualified
stakeholders.

## 13. Non-Functional Requirements

  -----------------------------------------------------------------------
  Area                                MVP requirement
  ----------------------------------- -----------------------------------
  Usability                           Core teacher workflow can be
                                      completed without technical
                                      assistance

  Performance                         Typical dashboard/list APIs respond
                                      within 2 seconds on demo data

  Reliability                         API errors are handled; no silent
                                      data loss

  Integrity                           Unique attendance per student/day;
                                      valid marks; foreign keys

  Security                            Authenticated routes, RBAC, school
                                      scoping, password hashing

  Maintainability                     Clear route/controller/service
                                      separation

  Responsiveness                      Usable on laptop and common mobile
                                      widths

  Explainability                      Every risk flag includes reasons
                                      and data status

  Accessibility                       Labels, keyboard focus, adequate
                                      contrast, semantic controls

  Portability                         Environment-based config;
                                      reproducible setup and seed
  -----------------------------------------------------------------------

## 14. Developer Responsibilities

### Developer 1 --- Backend and Database (primary)

Owns: - Express setup and API conventions. - Prisma 7/PostgreSQL
integration and migrations. - Schema and seed script. - Authentication,
authorization and school scoping. - Student, attendance, academic, risk
and intervention services. - Dashboard queries and API error handling.

Must publish API contracts and example responses early, before the
frontend is complete.

### Developer 2 --- Frontend and Integration (primary)

Owns: - React/Tailwind setup and design system. - Application shell,
navigation and login. - Student, attendance, academic, risk and
intervention pages. - API client and authentication state. - Form
validation and responsive states. - End-to-end frontend/backend
integration.

Can build against agreed mock JSON contracts while APIs are in progress,
then switch to the real API.

### Developer 3 --- Supporting developer (limited availability)

Owns independent, bounded tasks: - Seed/demo dataset preparation. -
Reusable UI components or a self-contained page section. - API test
collection and test-case execution. - Responsive/empty/error-state
fixes. - README/setup and demo script. - Risk algorithm test cases and
validation report.

Do not make Developer 3 the sole owner of a core service, migration,
authentication flow or integration dependency.

## 15. Eight-Day Development Schedule

The plan assumes Developer 1 and Developer 2 are the reliable capacity.
Developer 3 has smaller parallel tasks. Commit targets below are planned
meaningful checkpoints, not a reason to split trivial work.

  ---------------------------------------------------------------------------------------------------
  Day            Developer 1 ---    Developer 2 ---    Developer 3 --- support End-of-day outcome
                 backend            frontend                                   
  -------------- ------------------ ------------------ ----------------------- ----------------------
  1              Express scaffold,  React scaffold,    Repo setup notes,       Both apps run; schema
                 env config, Prisma Tailwind, app      sample school/student   and API contract
                 7 adapter setup,   shell, route plan  dataset                 agreed
                 initial                                                       
                 schema/migration                                              

  2              Auth/login,        Login page, auth   Login/API test cases;   Login works against
                 password hashing,  context, protected responsive sidebar      backend
                 JWT middleware,    layout, reusable   polish                  
                 role middleware    form controls                              

  3              Student CRUD,      Student list,      Seed script review and  Student CRUD
                 school-scoped      filters,           student form edge cases integrated
                 queries,           create/edit form,                          
                 validation         detail skeleton                            

  4              Attendance and     Attendance         API test collection;    Attendance and marks
                 assessment/marks   entry/history and  sample attendance/marks persist
                 APIs               academics pages    data                    

  5              Risk service,      Risk dashboard,    Risk threshold test     End-to-end risk flag
                 calculation,       reason breakdown,  matrix and edge-case    appears
                 persistence, risk  student detail     tests                   
                 endpoints          integration                                

  6              Intervention CRUD, Intervention       Test interventions,     Flag-to-intervention
                 dashboard          list/form/status   empty/error states,     workflow works
                 aggregate queries, flow, dashboard    responsive fixes        
                 overdue logic      integration                                

  7              Authorization      Integration fixes, Run test checklist,     Feature freeze;
                 review, bug fixes, UI polish,         README and demo script  critical bugs resolved
                 API tests, seed    loading/empty                              
                 cleanup            states                                     

  8              Final regression,  Final demo polish, Demo dataset            Stable demonstrable
                 migration/seed     responsive check,  verification,           MVP
                 verification,      presentation flow  screenshots/checklist   
                 deployment support                                            
  ---------------------------------------------------------------------------------------------------

### Daily operating rhythm

-   Start: 10--15 minute sync; confirm API contract and blockers.
-   Midday: integrate one vertical slice, not just separate
    frontend/backend work.
-   End: merge reviewed changes, run smoke tests, record known issues.
-   Keep a shared `reports.md` or issue board with completed work,
    blockers and next tasks.
-   Do not defer all integration to Day 7.

### Definition of Done per feature

A feature is done only when: 1. Database migration/schema is applied. 2.
API validates input and enforces role/school scope. 3. Frontend calls
the real API. 4. Success, loading, empty and error states work. 5. At
least one positive and one negative test pass. 6. Changes are committed
and integrated into the shared branch.

## 16. GitHub Contribution Plan

### 16.1 Target

Target **39 meaningful commits**: 13 per developer. This meets the 35+
repository target and gives each member visible, genuine contributions.
The target is a planning guide; never create empty or artificial commits
to hit a number.

### 16.2 Developer-wise commit allocation

  Developer       Target Ownership
  ------------- -------- -------------------------------------------------
  Developer 1         13 Backend, schema, APIs, risk logic, security
  Developer 2         13 React UI, forms, pages, API integration
  Developer 3         13 Tests, seed data, reusable components, docs, QA
  **Total**       **39** 

### 16.3 Day-wise commit allocation

  Day            Dev 1    Dev 2    Dev 3    Total
  ----------- -------- -------- -------- --------
  1                  2        2        2        6
  2                  2        2        2        6
  3                  2        2        2        6
  4                  2        2        2        6
  5                  2        2        1        5
  6                  1        1        2        4
  7                  1        1        1        3
  8                  1        1        1        3
  **Total**     **13**   **13**   **13**   **39**

### 16.4 Suggested commit sequence

These are example checkpoints. Make each commit only when the described
work is actually complete.

**Developer 1 --- backend (13)** 1.
`chore: initialize express api and environment configuration` 2.
`feat(db): configure prisma 7 postgres adapter` 3.
`feat(db): add school user class and student models` 4.
`feat(auth): implement login and password verification` 5.
`feat(auth): add jwt authentication and role middleware` 6.
`feat(students): add school-scoped student creation and listing` 7.
`feat(students): add student detail update and status endpoints` 8.
`feat(attendance): add attendance recording and duplicate validation` 9.
`feat(attendance): add student attendance history and summaries` 10.
`feat(academics): add assessment and student marks services` 11.
`feat(risk): implement explainable risk scoring service` 12.
`feat(interventions): add intervention lifecycle endpoints` 13.
`feat(dashboard): add database-backed metrics and authorization hardening`

**Developer 2 --- frontend (13)** 1.
`chore: initialize react app and tailwind styling` 2.
`feat(ui): add application shell sidebar and navigation` 3.
`feat(auth): build login page and protected route flow` 4.
`feat(ui): add reusable form controls badges and table` 5.
`feat(students): build searchable student listing` 6.
`feat(students): implement create and edit student forms` 7.
`feat(students): add student detail view` 8.
`feat(attendance): build attendance entry interface` 9.
`feat(attendance): add attendance history and summary` 10.
`feat(academics): add assessment and marks interface` 11.
`feat(risk): build risk dashboard and explainability panel` 12.
`feat(interventions): implement intervention tracking workflow` 13.
`feat(dashboard): integrate live metrics and responsive states`

**Developer 3 --- supporting work (13)** 1.
`docs: add repository setup and contribution guide` 2.
`test: define authentication and authorization test cases` 3.
`test: add student CRUD API test collection` 4.
`chore(seed): prepare realistic school and student fixtures` 5.
`test: validate student form edge cases` 6.
`test: cover attendance duplicates and status validation` 7.
`test: add attendance and marks sample scenarios` 8.
`test: validate risk scoring thresholds and missing data` 9.
`feat(ui): add reusable empty and error states` 10.
`fix(ui): improve responsive table and navigation behavior` 11.
`test: verify intervention status and overdue scenarios` 12.
`docs: add demo walkthrough and API testing instructions` 13.
`test: complete end-to-end acceptance checklist and report defects`

### 16.5 Branching strategy

-   `main`: stable, demonstrable code only.
-   `feature/backend-*`, `feature/frontend-*`, `feature/qa-*`:
    short-lived branches.
-   Merge through pull requests, even if reviewed informally by one
    teammate.
-   Agree on API paths, response shapes, enums and field names before
    parallel work.
-   Avoid simultaneous edits to Prisma schema, app routing and shared
    layout files.
-   One developer owns each shared file; communicate before changing it.
-   Pull/rebase frequently; resolve conflicts in the feature branch.
-   Merge small slices daily; do not maintain long-lived divergent
    branches.

### 16.6 Commit quality and verification

-   Commit working units, not arbitrary line counts.
-   Use conventional prefixes: `feat`, `fix`, `refactor`, `docs`,
    `test`, `chore`.
-   Never commit `.env`, credentials, student personal data or
    production database dumps.
-   Verify authorship and contribution graph settings before the project
    begins.
-   At the end, inspect `git log --oneline --all`, contributor
    statistics and merged PRs.
-   If one person contributes fewer commits because of availability,
    report actual work honestly rather than manufacturing activity.

## 17. Testing Strategy

### Backend/API

-   Login success, invalid password, inactive account.
-   Missing, expired and malformed JWT.
-   Role access matrix for each protected endpoint.
-   Cross-school ID access attempts return `404`/`403` without leaking
    data.
-   Student create/read/update/deactivate.
-   Duplicate student code within a school.
-   Attendance duplicate for same student/date.
-   Attendance history and denominator calculations.
-   Marks below zero or above maximum.
-   Risk threshold boundaries: 24/25 and 49/50.
-   Mutually exclusive rule bands.
-   No data, missing attendance, missing marks and provisional
    assessment.
-   Intervention creation, assignment, status update and overdue
    detection.
-   Dashboard totals match database fixtures.

### Frontend

-   Login and logout behavior.
-   Role-specific navigation.
-   Student form validation and server errors.
-   Attendance submission and duplicate feedback.
-   Marks validation.
-   Risk reason rendering and insufficient-data state.
-   Intervention status updates and overdue display.
-   Loading, empty, error and retry states.
-   Responsive layout and keyboard navigation.

### Suggested risk test cases

  -----------------------------------------------------------------------
  Case                                Expected result
  ----------------------------------- -----------------------------------
  Attendance 90%, no other indicators 0 points from attendance

  Attendance 80%                      +15

  Attendance 74.9%                    +30

  3 absent school days                +15

  5 absent school days                +25, not +40

  Academic decline 12 points          +10

  Academic decline 22 points          +20, not +30

  Financial barrier reported          +10

  Score 25                            MEDIUM

  Score 50                            HIGH

  No usable indicators                INSUFFICIENT_DATA

  Less than 10 recorded school days   PROVISIONAL when a usable signal
                                      exists
  -----------------------------------------------------------------------

### Demo data

Create one fictional school, 2--3 teachers, 1 principal/admin, 2--3
classes and 15--25 fictional students. Include varied but plausible
attendance, assessment and intervention states: - low-risk student with
complete data, - medium-risk student with moderate attendance concern, -
high-risk student with low attendance and absence streak, - student with
academic decline, - student with a reported financial barrier, - student
with insufficient data, - student with overdue intervention.

Use clearly fictional names and phone numbers. Never use real student
records for a public demo.

## 18. Final Demonstration Sequence

A 5--7 minute demo:

1.  **Login:** enter as a school administrator or principal.
2.  **School overview:** show live student count, attendance rate, risk
    categories and open interventions.
3.  **Register a student:** create a fictional student and show it
    appears in the database-backed list.
4.  **Record attendance:** mark several recent school days, including an
    absence streak.
5.  **Record marks:** add two same-subject assessments that demonstrate
    a decline.
6.  **Recalculate risk:** open the risk dashboard and show the score,
    category, reasons and data status.
7.  **Human review:** open the student profile, explain the flag and
    create an intervention with an owner and due date.
8.  **Track support:** update intervention status and add an
    outcome/follow-up date.
9.  **Show accountability:** return to dashboard and demonstrate updated
    counts and intervention status.
10. **Security proof:** briefly show that a teacher account sees only
    permitted navigation/data.

Do not claim the prototype has already reduced dropout rates. Explain
that it demonstrates an early identification and intervention workflow
whose real-world impact must be evaluated over time.

## 19. Acceptance Criteria

The MVP is accepted when all are true:

-   [ ] Staff can log in securely.
-   [ ] Role restrictions work on backend endpoints.
-   [ ] School-scoped access is enforced in queries.
-   [ ] Admin can create, view, update and deactivate students.
-   [ ] Attendance records persist and duplicate entries are rejected.
-   [ ] Assessment and marks records persist with validation.
-   [ ] Risk score is calculated from stored data and has visible
    reasons.
-   [ ] Missing data is explicitly represented.
-   [ ] Authorized staff can create and update interventions.
-   [ ] Dashboard metrics are database-derived.
-   [ ] Frontend pages call real APIs for P0 functionality.
-   [ ] Demo data covers low, medium, high and insufficient-data cases.
-   [ ] Core positive and negative API tests pass.
-   [ ] Setup instructions work on a fresh clone.
-   [ ] No secrets or real student data are committed.
-   [ ] Final demo can run from a clean, seeded environment.

## 20. Deployment and Handover Checklist

-   Set production `DATABASE_URL`, JWT secret and frontend origin
    securely.
-   Apply migrations using the project's Prisma 7 migration workflow.
-   Run seed only in a controlled demo/staging environment.
-   Build React frontend and configure API base URL.
-   Enable HTTPS and restrict CORS.
-   Create non-default admin credentials; never ship a public default
    password.
-   Test login, one full student workflow and cross-school denial after
    deployment.
-   Document backup/restore and known limitations.
-   Tag the stable release `v1.0.0`.

------------------------------------------------------------------------

**Final scope decision:** build the student record → attendance/marks →
explainable risk → human intervention → follow-up loop first. It is the
smallest cohesive product that directly demonstrates the problem
statement's intended value.
