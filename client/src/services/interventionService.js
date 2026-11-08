import { apiClient, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import {
  mockInterventionsOverview,
  mockInterventionsList,
} from '../data/mockInterventionsData.js';

/**
 * Intervention case counts.
 * GET /interventions/overview
 */
export async function getInterventionsOverview() {
  if (!USE_MOCKS) return apiClient('/interventions/overview');

  await mockDelay(300);
  return mockInterventionsOverview;
}

/**
 * Interventions with search & filters.
 * GET /interventions?status=...&priority=...&type=...&search=...
 */
export async function getInterventions(filters = {}) {
  const { status = 'all', priority = 'all', type = '', search = '' } = filters;

  if (!USE_MOCKS) {
    return apiClient(`/interventions${buildQuery({ status, priority, type, search })}`);
  }

  await mockDelay(350);
  let filtered = [...mockInterventionsList];

  if (status && status !== 'all') {
    filtered = filtered.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }
  if (priority && priority !== 'all') {
    filtered = filtered.filter((i) => i.priority.toLowerCase() === priority.toLowerCase());
  }
  if (type) {
    filtered = filtered.filter((i) => i.type === type);
  }
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.studentName.toLowerCase().includes(q) ||
        i.studentId.toLowerCase().includes(q) ||
        i.counselorName.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q)
    );
  }

  return { total: filtered.length, interventions: filtered };
}

/**
 * Create an intervention.
 * POST /interventions
 */
export async function createIntervention(interventionData) {
  if (!USE_MOCKS) {
    return apiClient('/interventions', { method: 'POST', body: JSON.stringify(interventionData) });
  }

  await mockDelay(400);
  const today = new Date().toISOString().split('T')[0];
  const newRecord = {
    id: `INT-${Math.floor(400 + Math.random() * 500)}`,
    studentId: interventionData.studentId,
    studentName: interventionData.studentName || 'Student',
    department: interventionData.department || 'Engineering',
    semester: parseInt(interventionData.semester, 10) || 4,
    type: interventionData.type || 'Academic Counseling',
    priority: interventionData.priority || 'normal',
    status: 'pending',
    counselorName: interventionData.counselorName || 'Unassigned',
    createdDate: today,
    scheduledDate: interventionData.scheduledDate || today,
    initialReason: interventionData.initialReason || 'Flagged during faculty review.',
    notes: interventionData.notes || 'Initial case opened.',
    history: [
      {
        timestamp: `${today} 10:00 AM`,
        author: interventionData.counselorName || 'Unassigned',
        action: 'Case Created',
        note: interventionData.notes || 'Intervention logged.',
      },
    ],
  };
  mockInterventionsList.unshift(newRecord);

  return { success: true, record: newRecord };
}

/**
 * Update status and add a timeline note.
 * PATCH /interventions/:id
 */
export async function updateIntervention(id, updateData) {
  if (!USE_MOCKS) {
    return apiClient(`/interventions/${id}`, { method: 'PATCH', body: JSON.stringify(updateData) });
  }

  await mockDelay(350);
  const current = mockInterventionsList.find((item) => item.id === id);
  if (!current) {
    throw new Error(`Intervention record ${id} not found.`);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (updateData.status) {
    current.status = updateData.status;
  }
  if (updateData.newNote) {
    current.notes = updateData.newNote;
    current.history.unshift({
      timestamp: `${todayStr} ${timeStr}`,
      author: updateData.author || 'Staff',
      action: `Status Updated to ${updateData.status || current.status}`,
      note: updateData.newNote,
    });
  }

  return { success: true, updatedRecord: current };
}
