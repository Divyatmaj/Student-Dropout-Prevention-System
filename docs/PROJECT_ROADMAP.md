# PROJECT_ROADMAP.md --- Udaan

> **Product:** Student Retention & Early Intervention Platform\
> **Roadmap horizon:** MVP to multi-school student-support platform\
> **Principle:** expand only when the preceding workflow is reliable and
> validated.

------------------------------------------------------------------------

## 1. Product Evolution Strategy

Udaan should evolve from a school-level early-warning and intervention
tool into a broader student-support coordination platform.

The product should not expand by simply accumulating unrelated features.
Each release should strengthen the same outcome:

**Notice a barrier → understand the context → connect the student to
support → follow up → learn what works.**

### Product principles

1.  **Human-led decisions:** analytics support educators; they do not
    decide a student's educational future.
2.  **Explainability:** every risk signal must be understandable and
    traceable to source records.
3.  **Privacy by design:** collect the minimum data needed, scope access
    and protect minors' information.
4.  **Interoperability:** future integrations should use documented APIs
    and explicit consent/authorization.
5.  **Evidence before complexity:** do not introduce machine learning
    until sufficient quality historical data and a valid evaluation plan
    exist.
6.  **Accessibility and inclusion:** design for low bandwidth, mobile
    use, varied literacy and assistive technologies.
7.  **Measurable outcomes:** track intervention completion and student
    progress, not vanity dashboard counts.

## 2. Version Overview

  -----------------------------------------------------------------------
  Version                 Theme                   Primary outcome
  ----------------------- ----------------------- -----------------------
  1.0                     Functional MVP          Staff can identify risk
                                                  indicators and track
                                                  interventions

  1.1                     Stronger student        More complete
                          support                 follow-up, guardian
                                                  communication and goal
                                                  setting

  1.2                     Financial assistance    Connect eligible
                                                  students with verified
                                                  financial support

  1.3                     Reliable school         Notifications, imports,
                          operations              auditability and data
                                                  quality

  2.0                     Community learning      Extend support beyond
                                                  the classroom

  2.1                     Flexible learning       Support alternative
                          pathways                schedules and
                                                  continuity

  3.0                     Evidence-led            Improve analytics and
                          intelligence            evaluate intervention
                                                  effectiveness

  3.x                     Multi-school ecosystem  Authorized
                                                  district-level
                                                  coordination and
                                                  integrations
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 3. Version 1.0 --- Functional MVP

**Status:** initial 7--8 day build.

### Features

-   Staff login and role-based access.
-   School and staff setup.
-   Student management.
-   Attendance tracking.
-   Assessment and marks tracking.
-   Transparent rule-based risk scoring.
-   Low/medium/high and insufficient-data states.
-   Explainable risk factors.
-   Intervention creation, assignment and status tracking.
-   Dashboard with database-derived metrics.
-   Seeded demonstration data.

### Database evolution

Initial entities: - `School` - `User` - `SchoolClass` - `Student` -
`Attendance` - `Assessment` - `StudentMark` - `RiskAssessment` -
`Intervention`

### Backend evolution

-   Express REST API.
-   Prisma 7 + PostgreSQL.
-   Authentication and RBAC.
-   School-scoped service queries.
-   Risk calculation service.
-   Dashboard aggregate endpoints.
-   Input validation and centralized error handling.

### Frontend evolution

-   Login and protected app shell.
-   Overview dashboard.
-   Student list/detail/forms.
-   Attendance and academic pages.
-   Risk list and explainability panel.
-   Intervention workflow.

### Dependencies and exit criteria

-   PostgreSQL persistence and migrations work.
-   Core workflow works end to end.
-   School boundary tests pass.
-   Risk thresholds and missing-data behavior are tested.
-   A seeded demo can be reproduced from setup instructions.

**Expected outcome:** a credible prototype that demonstrates early
identification and human-led intervention, without claiming proven
dropout reduction.

------------------------------------------------------------------------

## 4. Version 1.1 --- Enhanced Student Support

**Objective:** help staff maintain continuity after a student is
flagged.

### Features

-   Guardian communication log: date, channel, staff member, purpose and
    outcome.
-   Follow-up reminders inside the application.
-   Student academic goal setting and progress review.
-   Improved intervention history and notes.
-   Case review workflow: reviewed by, reviewed at, review notes and
    next review date.
-   Optional student-facing view of goals and supportive resources.
-   Configurable intervention templates for common concerns.

### Database changes

Add: - `GuardianContactLog` --- student, staff user, date, channel,
purpose, outcome. - `StudentGoal` --- student, title, target, due date,
status, progress notes. - `InterventionUpdate` --- intervention, author,
update type, note, timestamp. - Optional `Notification` --- recipient,
type, payload, read status, created time.

Avoid storing unnecessary call recordings, message contents or sensitive
family narratives. A short operational outcome is usually enough.

### Backend changes

-   CRUD APIs for guardian contact logs and goals.
-   Goal progress endpoints.
-   Follow-up and overdue queries.
-   Notification inbox endpoints if in-app notifications are
    implemented.
-   Audit trail for updates to sensitive records.

### Frontend changes

-   Guardian contact timeline on student detail.
-   Goal-setting panel.
-   Follow-up queue.
-   Intervention activity timeline.
-   Student-facing pages only after identity and access design is
    complete.

### Dependencies

-   Version 1.0 data model and authorization must be stable.
-   School policy must define who can contact guardians and what may be
    recorded.

### Exit criteria

-   Staff can see which follow-ups are due.
-   Goal progress is persisted and attributable.
-   Guardian-contact activity is visible only to authorized staff.
-   No automated communication is sent without a clear opt-in and
    approved template.

**Expected outcome:** the platform moves from flagging students to
coordinating sustained support.

------------------------------------------------------------------------

## 5. Version 1.2 --- Financial Assistance and Barrier Referral

**Objective:** make financial barriers actionable by helping staff
connect families with verified support options.

### Features

-   Scholarship and financial-aid directory.
-   Search by grade, location, eligibility conditions and deadline.
-   Eligibility pre-screening with clear "potential match" language.
-   Application checklist and status tracking.
-   Document checklist and secure upload only when required.
-   Disbursement status tracking for authorized administrators, if the
    institution manages funds.
-   Referral to a school counsellor/social worker or authorized support
    office.

### Database changes

Add: - `AidProgram` --- name, provider, description, eligibility rules,
location, deadline, source URL, verification date, active status. -
`AidApplication` --- student, program, status, submitted date, decision
date, assigned staff. - `AidChecklistItem` --- application, requirement,
completion state. - `AidReferral` --- student, referral type, status,
authorized owner, timestamps. - Optional `AidDisbursement` ---
application, amount, currency, date, status, reference; only if actual
disbursement tracking is in scope.

Do not store bank details or identity documents unless the institution
has a clear legal and operational need, secure storage and retention
policy.

### Backend changes

-   Aid-program CRUD for authorized administrators.
-   Search/filter endpoints.
-   Eligibility rules as explicit, versioned criteria.
-   Application lifecycle endpoints.
-   Deadline reminders.
-   Source verification metadata and stale-program warnings.

### Frontend changes

-   Aid discovery page.
-   Program details and eligibility checklist.
-   Application tracker.
-   Staff referral panel.
-   Admin program management.

### Dependencies

-   Verified, current scholarship sources and responsible content
    owners.
-   Clear policy for who can view application documents.
-   Security review before document upload.

### Exit criteria

-   Every listed program has a source and last-verified date.
-   Eligibility results are framed as guidance, not a guarantee.
-   Application status changes are auditable.
-   Sensitive documents are not exposed through ordinary student-list
    APIs.

**Expected outcome:** the platform can help staff turn a reported
economic barrier into a traceable referral or financial-support
application.

------------------------------------------------------------------------

## 6. Version 1.3 --- School Operations, Data Quality and Notifications

**Objective:** make the product dependable for routine school use before
expanding to external learning services.

### Features

-   CSV student import with preview and validation.
-   Attendance bulk entry and correction workflow.
-   In-app notifications for assigned cases and upcoming follow-ups.
-   Optional email/SMS/WhatsApp integration through approved providers.
-   Audit log for sensitive data access and changes.
-   Configurable attendance calendar and school-day rules.
-   Data-quality dashboard: missing attendance, missing marks, duplicate
    candidates and stale cases.
-   Exportable school reports with role checks.

### Database changes

Add: - `AuditLog` --- actor, action, entity type/id, timestamp, limited
metadata. - `ImportJob` and `ImportRowError` --- file metadata, status,
counts and validation errors. - `SchoolCalendarDay` --- school, date,
day type, academic year. - `NotificationPreference` --- user, channel,
event preferences. - `NotificationDelivery` --- provider status and safe
delivery metadata.

### Backend changes

-   Import preview/commit APIs.
-   Idempotent import handling.
-   Notification service abstraction.
-   Provider webhook validation if external messaging is enabled.
-   Audit middleware/service.
-   Calendar-aware attendance calculations.
-   Report export with permission checks.

### Frontend changes

-   Import wizard and error report.
-   Bulk attendance grid.
-   Notification inbox/preferences.
-   Audit viewer for authorized administrators.
-   Data-quality and missing-record dashboard.

### Dependencies

-   Stable 1.0--1.2 workflows.
-   Provider approval, messaging consent and template requirements
    before external messages.
-   Defined academic calendar.

### Exit criteria

-   Import errors are visible before data is committed.
-   Re-running an import does not create duplicates.
-   Attendance percentages use school calendar rules.
-   Sensitive operations produce audit records.
-   Notifications respect user preferences and consent.

**Expected outcome:** routine school operations become less manual and
more reliable.

------------------------------------------------------------------------

## 7. Version 2.0 --- Community Learning and Resource Hub

**Objective:** connect students to additional learning support when
school records indicate an academic or access barrier.

### Features

-   Curated resource library: lessons, worksheets, accessible formats
    and language tags.
-   Subject/grade/topic filtering.
-   Teacher-recommended learning resources.
-   Tutor/mentor directory with verified profiles.
-   Session scheduling and attendance.
-   Community learning hub directory for physical/local learning
    centers.
-   Low-bandwidth resource access and downloadable materials.
-   Moderated discussion or question submission, if staffing and
    safeguarding are available.

### Database changes

Add: - `LearningResource` --- title, description, subject, grade range,
language, format, URL/file reference, accessibility metadata, publisher,
review status. - `ResourceRecommendation` --- student, resource,
recommending staff, reason, status. - `Mentor` --- verified profile,
subjects, languages, availability, approval status. - `TutoringSession`
--- student/group, mentor, schedule, status, attendance outcome. -
`LearningHub` --- name, location, operating hours, contact and
verification status. - `HubEnrollment` --- student, hub, dates, status.

### Backend changes

-   Resource catalogue and search.
-   Recommendation APIs.
-   Mentor verification and approval.
-   Session scheduling and attendance.
-   Hub discovery and enrolment.
-   Moderation and reporting endpoints.

### Frontend changes

-   Resource library.
-   Student learning plan.
-   Tutor/mentor discovery.
-   Session calendar.
-   Community hub directory.
-   Low-bandwidth and mobile-first resource views.

### Dependencies

-   Content licensing and quality review.
-   Child safeguarding and mentor verification.
-   Moderation capacity.
-   Reliable resource hosting and accessibility testing.

### Exit criteria

-   Resources are reviewed, tagged and attributable to a source.
-   Mentors are verified before student interaction.
-   Scheduling conflicts are prevented.
-   Students can access core resources on low-bandwidth connections.

**Expected outcome:** Udaan extends beyond identifying problems and
helps students access additional learning opportunities.

------------------------------------------------------------------------

## 8. Version 2.1 --- Flexible Learning Pathways

**Objective:** help schools coordinate alternative learning schedules
and continuity arrangements for students who cannot consistently attend
standard schedules.

### Features

-   Alternative timetable templates (evening, part-time, bridge or
    catch-up sessions).
-   Student schedule requests and approval.
-   Flexible enrolment status and progress tracking.
-   Catch-up plan for missed learning.
-   Session attendance and completion.
-   Teacher workload and room/capacity planning (limited scope).
-   Integration with existing school timetable systems where feasible.

### Database changes

Add: - `LearningProgram` --- program type, eligibility, start/end,
owner. - `StudentProgramEnrollment` --- student, program, status,
approved by, dates. - `ScheduleSlot` --- program, date/time, venue or
online location, capacity. - `ScheduleEnrollment` --- student, slot,
status. - `LearningMilestone` --- student/program, expected outcome,
completion status.

### Backend changes

-   Program CRUD and enrolment approval.
-   Capacity and schedule-conflict validation.
-   Attendance for alternative sessions.
-   Progress and milestone reporting.
-   Export/integration endpoints.

### Frontend changes

-   Flexible program catalogue.
-   Enrolment request and approval workflow.
-   Student timetable.
-   Staff schedule management.
-   Progress overview.

### Dependencies

-   School leadership approval and policy.
-   Version 2.0 learning resources/hubs where used.
-   Calendar and attendance logic from Version 1.3.

### Exit criteria

-   Approved schedules do not exceed capacity.
-   Student attendance is tracked distinctly from standard timetable
    attendance.
-   Alternative learning progress can be reported without
    misrepresenting enrolment or attendance.

**Expected outcome:** the system supports continuity pathways rather
than treating standard attendance as the only route to learning.

------------------------------------------------------------------------

## 9. Version 3.0 --- Evidence-Led Analytics and Intelligent Insights

**Objective:** evaluate which signals and interventions are useful, then
improve prioritization responsibly.

### Features

-   Longitudinal attendance and academic trend analysis.
-   Cohort and school-level retention indicators.
-   Intervention effectiveness analysis.
-   Configurable rule versions and threshold comparisons.
-   Risk calibration using reviewed outcomes where sufficient data
    exists.
-   Model evaluation and drift monitoring before any predictive model is
    deployed.
-   Explainable analytics and confidence/data-quality indicators.
-   Authorized aggregate reports for district-level stakeholders.

### Database changes

Add: - `RiskAssessmentSnapshot` --- student, score, category, reasons,
rule/model version, data quality, calculated time. -
`InterventionOutcome` --- intervention, outcome category, review date,
evidence/notes. - `RiskRuleVersion` --- version, configuration,
effective dates, approved by. - `AnalyticsSnapshot` or warehouse tables
only if query volume justifies them. - `ModelVersion` and
`ModelEvaluation` only if a statistical/ML model is approved.

### Backend changes

-   Versioned risk engine interface.
-   Historical aggregation jobs (scheduled execution can be added only
    when needed).
-   Cohort/report APIs with minimum group-size protections.
-   Evaluation pipeline for precision/recall, calibration and subgroup
    performance.
-   Model registry/rollback process only if ML is introduced.

### Frontend changes

-   Trends over time.
-   Intervention outcome dashboards.
-   Cohort comparisons with privacy safeguards.
-   Rule explanation and version history.
-   Data quality and model monitoring views.

### Dependencies

-   Multiple terms/years of reliable data.
-   Clearly defined outcome labels and dropout/retention definitions.
-   Educator validation and institutional governance.
-   Privacy, fairness and security review.
-   Sufficient sample size and a defensible evaluation design.

### Important ML gate

Do not train a model merely because the product description uses the
phrase "AI-driven." Before any model is used operationally: 1. Define
the target outcome precisely and the prediction horizon. 2. Verify data
quality and label provenance. 3. Establish a baseline rule-based model.
4. Split evaluation data by time and, where appropriate, school to avoid
leakage. 5. Measure false positives and false negatives, calibration and
subgroup performance. 6. Conduct educator review and an impact
assessment. 7. Keep human review and a rollback path. 8. Never use model
output as an automatic exclusion, punishment or eligibility decision.

### Exit criteria

-   Analytics can be reproduced from documented definitions.
-   Historical changes are traceable to rule/model versions.
-   Model performance is measured against a baseline.
-   Privacy safeguards prevent exposing small identifiable groups.
-   Educators understand limitations and can challenge a flag.

**Expected outcome:** risk prioritization becomes evidence-led and its
real-world usefulness can be evaluated rather than assumed.

------------------------------------------------------------------------

## 10. Multi-School and District Ecosystem (3.x)

This is a platform evolution, not a prerequisite for the MVP.

### Features

-   Multi-school tenancy with strong data isolation.
-   District-level aggregate dashboards.
-   School onboarding and configuration.
-   Standardized data import/export.
-   Authorized data exchange with existing education systems.
-   District intervention programs and resource allocation.
-   Cross-school student transfer workflows with authorization and
    auditability.

### Technical evolution

-   Tenant-aware authorization and database query policies.
-   Formal API versioning and integration contracts.
-   Background processing for imports and large reports if volume
    requires it.
-   Observability: structured logs, metrics, error tracking and backups.
-   Data retention and deletion workflows.
-   Stronger audit trails and access reviews.

### Privacy safeguards

-   District reports should default to aggregate data.
-   Suppress small groups where re-identification is possible.
-   Do not expose identifiable student records to district users without
    explicit authority and a defined purpose.
-   Log and review cross-school access.
-   Transfer only the minimum necessary student information.

**Expected outcome:** authorized education stakeholders can coordinate
support while schools retain appropriate control over student-level
information.

------------------------------------------------------------------------

## 11. Cross-Version Technical Strategy

### 11.1 Architecture progression

  ----------------------------------------------------------------------------
  Layer                   v1.0                    Later evolution
  ----------------------- ----------------------- ----------------------------
  Frontend                React SPA               More role-specific
                                                  experiences,
                                                  low-bandwidth/mobile-first
                                                  UX

  Backend                 Express modular         Keep modular monolith until
                          monolith                scale justifies separation

  Database                PostgreSQL + Prisma     Add audit/history, calendar,
                                                  resources and analytics
                                                  tables

  Authentication          JWT + RBAC              Stronger session lifecycle,
                                                  MFA for privileged roles if
                                                  required

  Risk engine             Rule-based service      Versioned rules; validated
                                                  statistical model only when
                                                  justified

  Notifications           In-app/manual           Provider adapters with
                                                  consent and delivery
                                                  tracking

  Files                   None or minimal         Secure document/resource
                                                  storage with scanning and
                                                  access control

  Analytics               Live aggregate queries  Historical
                                                  snapshots/warehouse only
                                                  when justified
  ----------------------------------------------------------------------------

### 11.2 Keep the modular monolith

Do not split into microservices early. Keep clear modules inside one
Express application: - identity/access, - school/students, -
attendance/academics, - risk, - interventions, - financial aid, -
learning resources, - notifications, - reporting.

Extract a service only when there is a concrete operational reason such
as independent scaling, separate ownership or reliability isolation.

### 11.3 API and migration discipline

-   Keep `/api/v1` stable; introduce a new API version only for breaking
    changes.
-   Use Prisma migrations for every schema change.
-   Seed demo data separately from production setup.
-   Add indexes based on real query patterns.
-   Add pagination to list/report endpoints.
-   Maintain a changelog and release tags.
-   Keep backward-compatible fields where possible.

### 11.4 Data governance

-   Define who owns each data field.
-   Document why each field is collected.
-   Set retention and deletion rules.
-   Separate operational notes from confidential counselling records.
-   Provide correction workflows.
-   Review role permissions periodically.
-   Avoid collecting sensitive attributes for convenience.
-   Use fictional data in development and demonstrations.

## 12. Success Metrics

### Product operation metrics

-   Percentage of active students with sufficiently complete attendance
    data.
-   Percentage of flagged students reviewed within the school's target
    window.
-   Percentage of interventions with assigned owner and due date.
-   Intervention follow-up completion rate.
-   Median time from flag to first documented review.
-   Percentage of risk flags with documented reasons and review outcome.

### Student-support indicators

-   Attendance trend before and after intervention.
-   Academic progress trend for students receiving support.
-   Repeat absence patterns.
-   Participation in learning resources or flexible programs.
-   Continuation/enrolment at subsequent checkpoints, where reliably
    measured.

### Evaluation cautions

-   A rise in flags may reflect better data capture, not worsening
    dropout.
-   An increase in intervention count is not itself a positive outcome.
-   Before/after comparisons do not prove causation.
-   Compare similar cohorts and account for term calendars, policy
    changes and missing data.
-   Define dropout, transfer, completion and temporary absence
    consistently before reporting retention.

## 13. Recommended Release Gates

  -----------------------------------------------------------------------
  Gate                                Required evidence
  ----------------------------------- -----------------------------------
  v1.0 → v1.1                         Core workflow stable; authorization
                                      and data quality reviewed

  v1.1 → v1.2                         Guardian workflow approved;
                                      financial-support content owner
                                      identified

  v1.2 → v1.3                         Aid information verified; sensitive
                                      document handling reviewed

  v1.3 → v2.0                         School operations reliable;
                                      safeguarding and content governance
                                      ready

  v2.0 → v2.1                         Resource/mentor operations
                                      validated; school scheduling policy
                                      agreed

  v2.1 → v3.0                         Longitudinal, high-quality data and
                                      outcome definitions available

  v3.0 → district scale               Security, privacy, fairness,
                                      governance and operational capacity
                                      assessed
  -----------------------------------------------------------------------

## 14. Long-Term Product Vision

Udaan should become a coordinated student-support layer for schools:
connecting school records, educators, families, financial assistance and
community learning resources around a shared goal of educational
continuity.

The long-term differentiator is not an opaque prediction score. It is
the combination of: - early, explainable signals, - human review, -
actionable support pathways, - reliable follow-up, - evidence about what
helps, - privacy-respecting coordination across institutions.

Build that foundation first. Expand only when the product can
demonstrate that each new capability improves the quality, timeliness or
reach of student support.
