/**
 * Mock interventions for the Udaan web app (VITE_USE_MOCKS=true only).
 *
 * Shape matches the Udaan API `Intervention` resource:
 *   {
 *     id, studentId,
 *     category: ATTENDANCE | ACADEMIC | FINANCIAL | ACCESSIBILITY | FAMILY | OTHER,
 *     priority: LOW | MEDIUM | HIGH,
 *     status:   OPEN | IN_PROGRESS | COMPLETED | CANCELLED,
 *     description, actionPlan, outcome,
 *     dueDate, followUpDate,                     // YYYY-MM-DD
 *     assignedToId, assignedToName, createdById, createdByName,
 *     createdAt, updatedAt,
 *     riskSnapshot: { score, category, reasons: [{ code, label, points }] } | null,
 *     history: [{ id, at, byId, byName, type, fromStatus?, toStatus?, note? }]
 *   }
 * `riskSnapshot` is copied when the intervention is created and never
 * updated, so the reasons that prompted it are kept even after the score
 * changes. History is append-only (newest last).
 *
 * Contract:
 *   GET   /interventions/overview                → { counts, overdue, dueThisWeek }
 *   GET   /interventions?status=&priority=&category=&assignedTo=&due=&studentId=&search=
 *         → { interventions, total }
 *   GET   /interventions/:id                     → Intervention
 *   POST  /interventions                         → Intervention
 *   PATCH /interventions/:id                     body { description?, actionPlan?, priority?,
 *         category?, assignedToId?, dueDate?, followUpDate?, note? } → Intervention
 *   PATCH /interventions/:id/status              body { status, outcome?, note? } → Intervention
 */

const STAFF = {
  admin: { id: 'USR-001', name: 'Radhika Sharma' },
  principal: { id: 'USR-002', name: 'Amit Verma' },
  neha: { id: 'USR-003', name: 'Neha Gupta' },
  farhan: { id: 'USR-005', name: 'Farhan Khan' },
};

const event = (n, at, by, type, extra = {}) => ({ id: `EVT-${n}`, at, byId: by.id, byName: by.name, type, ...extra });

export const mockInterventionsList = [
  {
    id: 'INT-007',
    studentId: 'STU-1042',
    category: 'FINANCIAL',
    priority: 'HIGH',
    status: 'OPEN',
    description:
      'Aarav has been missing school since his father lost his job — the family says they cannot afford the bus fare every day. Maths result also dropped.',
    actionPlan: 'Ask the office whether the school bus-pass fund can cover him this term. Call his mother once the pass is arranged.',
    outcome: null,
    dueDate: '2026-11-12',
    followUpDate: '2026-11-19',
    assignedToId: STAFF.neha.id,
    assignedToName: STAFF.neha.name,
    createdById: STAFF.neha.id,
    createdByName: STAFF.neha.name,
    createdAt: '2026-11-05T10:30:00.000Z',
    updatedAt: '2026-11-05T10:30:00.000Z',
    riskSnapshot: {
      score: 60,
      category: 'HIGH',
      reasons: [
        { code: 'LOW_ATTENDANCE', label: 'Attendance is below 75%', points: 30 },
        { code: 'SEVERE_ACADEMIC_DECLINE', label: 'Mathematics result dropped 24 percentage points', points: 20 },
        { code: 'FINANCIAL_BARRIER', label: 'Financial barrier reported', points: 10 },
      ],
    },
    history: [event(1, '2026-11-05T10:30:00.000Z', STAFF.neha, 'CREATED')],
  },
  {
    id: 'INT-006',
    studentId: 'STU-1089',
    category: 'ATTENDANCE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Sneha has missed about a third of school days since October. Her mother has been unwell and Sneha is helping at home.',
    actionPlan: 'Home visit with the class teacher. Agree a plan for mornings; connect the family with the local health worker.',
    outcome: null,
    dueDate: '2026-11-07',
    followUpDate: '2026-11-14',
    assignedToId: STAFF.principal.id,
    assignedToName: STAFF.principal.name,
    createdById: STAFF.principal.id,
    createdByName: STAFF.principal.name,
    createdAt: '2026-11-04T11:00:00.000Z',
    updatedAt: '2026-11-05T16:30:00.000Z',
    riskSnapshot: {
      score: 40,
      category: 'MEDIUM',
      reasons: [
        { code: 'LOW_ATTENDANCE', label: 'Attendance is below 75%', points: 30 },
        { code: 'MODERATE_ACADEMIC_DECLINE', label: 'Mathematics result dropped 12 percentage points', points: 10 },
      ],
    },
    history: [
      event(2, '2026-11-04T11:00:00.000Z', STAFF.principal, 'CREATED'),
      event(3, '2026-11-05T16:30:00.000Z', STAFF.principal, 'STATUS_CHANGED', {
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        note: 'Phoned the father. Home visit planned for this week.',
      }),
    ],
  },
  {
    id: 'INT-005',
    studentId: 'STU-1120',
    category: 'ATTENDANCE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Rohan has been absent for five school days in a row with no message from home.',
    actionPlan: 'Call the guardian today. If unreachable, ask a classmate\'s family nearby to check in.',
    outcome: null,
    dueDate: '2026-11-09',
    followUpDate: '2026-11-16',
    assignedToId: STAFF.neha.id,
    assignedToName: STAFF.neha.name,
    createdById: STAFF.admin.id,
    createdByName: STAFF.admin.name,
    createdAt: '2026-11-06T09:15:00.000Z',
    updatedAt: '2026-11-06T14:00:00.000Z',
    riskSnapshot: {
      score: 55,
      category: 'HIGH',
      reasons: [
        { code: 'LOW_ATTENDANCE', label: 'Attendance is below 75%', points: 30 },
        { code: 'ABSENCE_STREAK_5_PLUS', label: '5 consecutive absent school days', points: 25 },
      ],
    },
    history: [
      event(4, '2026-11-06T09:15:00.000Z', STAFF.admin, 'CREATED'),
      event(5, '2026-11-06T14:00:00.000Z', STAFF.neha, 'STATUS_CHANGED', {
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        note: 'Mother answered — Rohan had a fever. Will return Monday; asked for a note from the clinic.',
      }),
    ],
  },
  {
    id: 'INT-004',
    studentId: 'STU-1194',
    category: 'ACADEMIC',
    priority: 'MEDIUM',
    status: 'OPEN',
    description: 'Ananya\'s Science result fell from 84% to 60% between unit tests.',
    actionPlan: 'Short check-in to see which topics were difficult; offer the lunchtime Science help group.',
    outcome: null,
    dueDate: '2026-11-13',
    followUpDate: null,
    assignedToId: STAFF.farhan.id,
    assignedToName: STAFF.farhan.name,
    createdById: STAFF.admin.id,
    createdByName: STAFF.admin.name,
    createdAt: '2026-11-03T13:45:00.000Z',
    updatedAt: '2026-11-03T13:45:00.000Z',
    riskSnapshot: {
      score: 35,
      category: 'MEDIUM',
      reasons: [
        { code: 'SEVERE_ACADEMIC_DECLINE', label: 'Science result dropped 24 percentage points', points: 20 },
        { code: 'MODERATE_ATTENDANCE', label: 'Attendance is between 75% and 85%', points: 15 },
      ],
    },
    history: [event(6, '2026-11-03T13:45:00.000Z', STAFF.admin, 'CREATED')],
  },
  {
    id: 'INT-003',
    studentId: 'STU-1205',
    category: 'FAMILY',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    description: 'Vikram has been arriving late or missing mornings because he helps at the family shop.',
    actionPlan: 'Meet his father to discuss school hours.',
    outcome: 'Father agreed Vikram will not work at the shop on school mornings. No absences in the two weeks since.',
    dueDate: '2026-10-24',
    followUpDate: '2026-11-21',
    assignedToId: STAFF.principal.id,
    assignedToName: STAFF.principal.name,
    createdById: STAFF.principal.id,
    createdByName: STAFF.principal.name,
    createdAt: '2026-10-20T11:30:00.000Z',
    updatedAt: '2026-10-24T15:00:00.000Z',
    riskSnapshot: {
      score: 25,
      category: 'MEDIUM',
      reasons: [
        { code: 'MODERATE_ATTENDANCE', label: 'Attendance is between 75% and 85%', points: 15 },
        { code: 'FINANCIAL_BARRIER', label: 'Financial barrier reported', points: 10 },
      ],
    },
    history: [
      event(7, '2026-10-20T11:30:00.000Z', STAFF.principal, 'CREATED'),
      event(8, '2026-10-24T15:00:00.000Z', STAFF.principal, 'STATUS_CHANGED', {
        fromStatus: 'OPEN',
        toStatus: 'COMPLETED',
      }),
    ],
  },
  {
    id: 'INT-002',
    studentId: 'STU-1231',
    category: 'ACADEMIC',
    priority: 'LOW',
    status: 'COMPLETED',
    description: 'Pooja missed the fractions lessons in September and asked for help catching up.',
    actionPlan: 'Two catch-up sessions after school.',
    outcome: 'Both sessions attended. Pooja is confident with the topic again.',
    dueDate: '2026-10-10',
    followUpDate: null,
    assignedToId: STAFF.neha.id,
    assignedToName: STAFF.neha.name,
    createdById: STAFF.neha.id,
    createdByName: STAFF.neha.name,
    createdAt: '2026-09-29T08:40:00.000Z',
    updatedAt: '2026-10-09T15:20:00.000Z',
    riskSnapshot: null,
    history: [
      event(9, '2026-09-29T08:40:00.000Z', STAFF.neha, 'CREATED'),
      event(10, '2026-10-02T15:10:00.000Z', STAFF.neha, 'STATUS_CHANGED', { fromStatus: 'OPEN', toStatus: 'IN_PROGRESS' }),
      event(11, '2026-10-09T15:20:00.000Z', STAFF.neha, 'STATUS_CHANGED', { fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED' }),
    ],
  },
  {
    id: 'INT-001',
    studentId: 'STU-1011',
    category: 'OTHER',
    priority: 'LOW',
    status: 'CANCELLED',
    description: 'Priya\'s parents asked about extra reading support.',
    actionPlan: 'Add Priya to the library reading club.',
    outcome: null,
    dueDate: '2026-10-15',
    followUpDate: null,
    assignedToId: STAFF.admin.id,
    assignedToName: STAFF.admin.name,
    createdById: STAFF.admin.id,
    createdByName: STAFF.admin.name,
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-08T12:00:00.000Z',
    riskSnapshot: null,
    history: [
      event(12, '2026-10-05T10:00:00.000Z', STAFF.admin, 'CREATED'),
      event(13, '2026-10-08T12:00:00.000Z', STAFF.admin, 'STATUS_CHANGED', {
        fromStatus: 'OPEN',
        toStatus: 'CANCELLED',
        note: 'Family arranged reading lessons outside school — not needed.',
      }),
    ],
  },
];
