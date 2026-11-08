import { apiClient, USE_MOCKS, mockDelay } from './api.js';
import { mockDashboardOverview } from '../data/mockDashboardData.js';

/**
 * Executive dashboard overview.
 * GET /dashboard/overview
 *
 * `simulateError` / `simulateEmpty` let the dashboard preview its
 * error and empty states in mock mode.
 */
export async function getDashboardOverview(options = {}) {
  const { simulateError = false, simulateEmpty = false } = options;

  if (simulateError) {
    await mockDelay(500);
    throw new Error('Database connection timeout: Unable to reach PostgreSQL cluster.');
  }

  if (simulateEmpty) {
    await mockDelay(400);
    return {
      stats: {
        totalStudents: 0,
        highRiskStudents: 0,
        mediumRiskStudents: 0,
        averageAttendance: 0,
        pendingInterventions: 0,
      },
      riskDistribution: {
        high: { count: 0, percentage: 0 },
        medium: { count: 0, percentage: 0 },
        low: { count: 0, percentage: 0 },
      },
      urgentStudents: [],
      recentInterventions: [],
      attendanceOverview: {
        overallRate: 0,
        departments: [],
      },
      academicOverview: {
        averageGPA: 0,
        overallPassRate: 0,
        clearedFirstAttempt: 0,
        assessmentsEvaluated: 0,
      },
    };
  }

  if (!USE_MOCKS) return apiClient('/dashboard/overview');

  await mockDelay(400);
  return mockDashboardOverview;
}
