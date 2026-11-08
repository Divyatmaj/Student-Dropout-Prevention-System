import { apiClient, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import {
  mockAttendanceOverview,
  mockAttendanceRecords,
} from '../data/mockAttendanceData.js';

/**
 * Attendance analytics overview.
 * GET /attendance/overview
 */
export async function getAttendanceOverview() {
  if (!USE_MOCKS) return apiClient('/attendance/overview');

  await mockDelay(300);
  return mockAttendanceOverview;
}

/**
 * Filtered attendance records.
 * GET /attendance/records?date=...&student=...&course=...&status=...
 */
export async function getAttendanceRecords(filters = {}) {
  const { date = '', student = '', course = '', status = '' } = filters;

  if (!USE_MOCKS) {
    return apiClient(`/attendance/records${buildQuery({ date, student, course, status })}`);
  }

  await mockDelay(350);
  let filtered = [...mockAttendanceRecords];

  if (date) {
    filtered = filtered.filter((r) => r.date === date);
  }
  if (student.trim()) {
    const q = student.toLowerCase().trim();
    filtered = filtered.filter(
      (r) => r.studentName.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q)
    );
  }
  if (course) {
    filtered = filtered.filter((r) => r.course === course);
  }
  if (status) {
    filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
  }

  return { total: filtered.length, records: filtered };
}

/**
 * Record one attendance entry.
 * POST /attendance
 */
export async function recordAttendance(attendanceData) {
  if (!USE_MOCKS) {
    return apiClient('/attendance', { method: 'POST', body: JSON.stringify(attendanceData) });
  }

  await mockDelay(400);
  const newRecord = {
    id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
    date: attendanceData.date || new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    studentId: attendanceData.studentId,
    studentName: attendanceData.studentName || 'Student',
    department: attendanceData.department || 'Engineering',
    semester: parseInt(attendanceData.semester, 10) || 1,
    course: attendanceData.course,
    facultyName: attendanceData.facultyName || 'Course Instructor',
    durationHours: parseFloat(attendanceData.durationHours) || 1,
    status: attendanceData.status || 'Present',
    remarks: attendanceData.remarks || 'Recorded via coordinator portal',
  };
  mockAttendanceRecords.unshift(newRecord);

  return { success: true, record: newRecord };
}
