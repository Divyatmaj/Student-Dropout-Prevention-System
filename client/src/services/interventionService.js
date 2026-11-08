import { apiClient } from './api.js';
import {
  mockInterventionsOverview,
  mockInterventionsList,
} from '../data/mockInterventionsData.js';

/**
 * Service to interact with the Intervention Management API.
 * Prepared for Express + PostgreSQL backend integration.
 */

/**
 * Fetch high-level interventions case overview counts
 * Target: GET /interventions/overview
 */
export async function getInterventionsOverview() {
  try {
    const data = await apiClient('/interventions/overview');
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at /interventions/overview not reachable. Using mock overview.',
      error.message
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockInterventionsOverview;
  }
}

/**
 * Fetch list of intervention records with search & filters
 * Target: GET /interventions?status=...&priority=...&type=...&search=...
 */
export async function getInterventions(filters = {}) {
  const { status = 'all', priority = 'all', type = '', search = '' } = filters;

  const queryParams = new URLSearchParams();
  if (status && status !== 'all') queryParams.set('status', status);
  if (priority && priority !== 'all') queryParams.set('priority', priority);
  if (type) queryParams.set('type', type);
  if (search) queryParams.set('search', search);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const data = await apiClient(`/interventions${queryString}`);
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at /interventions${queryString} not reachable. Using local mock dataset.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

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

    return {
      total: filtered.length,
      interventions: filtered,
    };
  }
}

/**
 * Register a new intervention case
 * Target: POST /interventions
 */
export async function createIntervention(interventionData) {
  try {
    const data = await apiClient('/interventions', {
      method: 'POST',
      body: JSON.stringify(interventionData),
    });
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at POST /interventions not reachable. Prepending to mock list.',
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    const newId = `INT-${Math.floor(400 + Math.random() * 500)}`;
    const today = new Date().toISOString().split('T')[0];

    const newRecord = {
      id: newId,
      studentId: interventionData.studentId,
      studentName: interventionData.studentName || 'Student',
      department: interventionData.department || 'Engineering',
      semester: parseInt(interventionData.semester, 10) || 4,
      type: interventionData.type || 'Academic Counseling',
      priority: interventionData.priority || 'normal',
      status: 'pending',
      counselorName: interventionData.counselorName || 'Dr. Radhika Sharma',
      createdDate: today,
      scheduledDate: interventionData.scheduledDate || today,
      initialReason: interventionData.initialReason || 'Flagged during faculty review.',
      notes: interventionData.notes || 'Initial case opened.',
      history: [
        {
          timestamp: `${today} 10:00 AM`,
          author: interventionData.counselorName || 'Dr. Radhika Sharma',
          action: 'Case Created',
          note: interventionData.notes || 'Intervention logged via coordinator portal.',
        },
      ],
    };

    mockInterventionsList.unshift(newRecord);

    return {
      success: true,
      record: newRecord,
    };
  }
}

/**
 * Update intervention status and add milestone notes
 * Target: PATCH /interventions/:id
 */
export async function updateIntervention(id, updateData) {
  try {
    const data = await apiClient(`/interventions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at PATCH /interventions/${id} not reachable. Updating mock record in memory.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

    const index = mockInterventionsList.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Intervention record ${id} not found.`);
    }

    const current = mockInterventionsList[index];
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (updateData.status) {
      current.status = updateData.status;
    }

    if (updateData.newNote) {
      current.notes = updateData.newNote;
      current.history.unshift({
        timestamp: `${todayStr} ${timeStr}`,
        author: updateData.author || 'Dr. Radhika Sharma',
        action: `Status Updated to ${updateData.status || current.status}`,
        note: updateData.newNote,
      });
    }

    return {
      success: true,
      updatedRecord: current,
    };
  }
}
