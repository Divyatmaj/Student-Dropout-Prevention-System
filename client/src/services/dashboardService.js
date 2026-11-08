import { apiClient } from './api.js';
import { mockDashboardOverview } from '../data/mockDashboardData.js';

/**
 * Service to fetch executive dashboard overview data
 * 
 * Target endpoint: GET /dashboard/overview
 * 
 * Supports seamless fallback to mock data when backend is not running,
 * and allows UI testing of Loading, Empty, and Error states.
 */
export async function getDashboardOverview(options = {}) {
  const { simulateError = false, simulateEmpty = false } = options;

  // 1. If explicit error simulation is requested (for testing ErrorState)
  if (simulateError) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error('Database connection timeout: Unable to reach PostgreSQL cluster.');
  }

  // 2. If explicit empty simulation is requested (for testing EmptyState)
  if (simulateEmpty) {
    await new Promise((resolve) => setTimeout(resolve, 400));
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

  // 3. Attempt live API call to Express / PostgreSQL backend
  try {
    const data = await apiClient('/dashboard/overview');
    return data;
  } catch (error) {
    // If backend server is not running during early frontend development,
    // gracefully fall back to structured mock dataset
    console.info(
      '[Udaan Service] Express backend at /dashboard/overview not yet reachable. Falling back to local mock response.',
      error.message
    );
    // Add realistic 400ms loading simulation
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockDashboardOverview;
  }
}
