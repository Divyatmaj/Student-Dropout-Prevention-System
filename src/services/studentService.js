import { apiClient } from './api.js';
import {
  mockStudentsList,
  mockStudentProfiles,
  generateStudentProfileFallback,
} from '../data/mockStudentsData.js';

/**
 * Service to interact with the Student Management endpoints.
 * Ready for Express / Prisma / PostgreSQL backend integration.
 */

/**
 * Fetch list of students with optional search & filter query params
 * Target: GET /students?search=...&department=...&riskLevel=...&semester=...
 */
export async function getStudents(filters = {}) {
  const { search = '', department = '', riskLevel = '', semester = '' } = filters;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (department) queryParams.set('department', department);
  if (riskLevel) queryParams.set('riskLevel', riskLevel);
  if (semester) queryParams.set('semester', semester);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const data = await apiClient(`/students${queryString}`);
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at /students${queryString} not reachable. Using local mock dataset.`,
      error.message
    );

    // Realistic network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Client-side filtering on mock data
    let filtered = [...mockStudentsList];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (department) {
      filtered = filtered.filter((s) => s.department === department);
    }

    if (riskLevel) {
      filtered = filtered.filter((s) => s.riskLevel === riskLevel);
    }

    if (semester) {
      filtered = filtered.filter((s) => s.semester.toString() === semester.toString());
    }

    return {
      total: filtered.length,
      students: filtered,
    };
  }
}

/**
 * Fetch detailed profile summary for an individual student
 * Target: GET /students/:id/summary
 */
export async function getStudentSummary(studentId) {
  try {
    const data = await apiClient(`/students/${studentId}/summary`);
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at /students/${studentId}/summary not reachable. Using local mock profile.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

    if (mockStudentProfiles[studentId]) {
      return mockStudentProfiles[studentId];
    }

    return generateStudentProfileFallback(studentId);
  }
}

/**
 * Register a new student into the institutional roster
 * Target: POST /students
 */
export async function createStudent(studentData) {
  try {
    const data = await apiClient('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at POST /students not reachable. Adding to local mock state.',
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    const newStudent = {
      id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: studentData.name,
      rollNo: studentData.rollNo || `GEN-${Date.now().toString().slice(-4)}`,
      email: studentData.email,
      phone: studentData.phone || '+91 90000 00000',
      department: studentData.department,
      semester: parseInt(studentData.semester, 10) || 1,
      enrollmentYear: new Date().getFullYear(),
      attendanceRate: 100.0,
      gpa: 8.0,
      failedAssessmentsCount: 0,
      riskLevel: 'low',
      riskReason: 'Newly enrolled student. Default on-track monitoring status.',
    };

    // Prepend to mock list in memory
    mockStudentsList.unshift(newStudent);

    return {
      success: true,
      student: newStudent,
    };
  }
}
