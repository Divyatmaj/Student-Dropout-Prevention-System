import { apiClient, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import {
  mockStudentsList,
  mockStudentProfiles,
  generateStudentProfileFallback,
} from '../data/mockStudentsData.js';

/**
 * List students with optional search & filters.
 * GET /students?search=...&department=...&riskLevel=...&semester=...
 */
export async function getStudents(filters = {}) {
  const { search = '', department = '', riskLevel = '', semester = '' } = filters;

  if (!USE_MOCKS) {
    return apiClient(`/students${buildQuery({ search, department, riskLevel, semester })}`);
  }

  await mockDelay(300);
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

  return { total: filtered.length, students: filtered };
}

/**
 * Student profile with attendance, marks, risk and interventions.
 * GET /students/:id/summary
 */
export async function getStudentSummary(studentId) {
  if (!USE_MOCKS) return apiClient(`/students/${studentId}/summary`);

  await mockDelay(350);
  return mockStudentProfiles[studentId] || generateStudentProfileFallback(studentId);
}

/**
 * Create a student.
 * POST /students
 */
export async function createStudent(studentData) {
  if (!USE_MOCKS) {
    return apiClient('/students', { method: 'POST', body: JSON.stringify(studentData) });
  }

  await mockDelay(400);
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
  mockStudentsList.unshift(newStudent);

  return { success: true, student: newStudent };
}
