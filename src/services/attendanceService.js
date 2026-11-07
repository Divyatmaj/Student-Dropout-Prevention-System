import { apiClient } from './api.js';
import {
  mockAttendanceOverview,
  mockAttendanceRecords,
} from '../data/mockAttendanceData.js';

/**
 * Service to interact with the Attendance Management API.
 * Prepared for Express + PostgreSQL backend integration.
 */

/**
 * Fetch institutional attendance analytics overview
 * Target: GET /attendance/overview
 */
export async function getAttendanceOverview() {
  try {
    const data = await apiClient('/attendance/overview');
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at /attendance/overview not reachable. Using mock attendance overview.',
      error.message
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockAttendanceOverview;
  }
}

/**
 * Fetch filtered attendance logs
 * Target: GET /attendance/records?date=...&student=...&course=...&status=...
 */
export async function getAttendanceRecords(filters = {}) {
  const { date = '', student = '', course = '', status = '' } = filters;

  const queryParams = new URLSearchParams();
  if (date) queryParams.set('date', date);
  if (student) queryParams.set('student', student);
  if (course) queryParams.set('course', course);
  if (status) queryParams.set('status', status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const data = await apiClient(`/attendance/records${queryString}`);
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at /attendance/records${queryString} not reachable. Using local mock records.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

    let filtered = [...mockAttendanceRecords];

    if (date) {
      filtered = filtered.filter((r) => r.date === date);
    }

    if (student.trim()) {
      const q = student.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q)
      );
    }

    if (course) {
      filtered = filtered.filter((r) => r.course === course);
    }

    if (status) {
      filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    return {
      total: filtered.length,
      records: filtered,
    };
  }
}

/**
 * Record a new attendance log entry
 * Target: POST /attendance
 */
export async function recordAttendance(attendanceData) {
  try {
    const data = await apiClient('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at POST /attendance not reachable. Prepending to mock records.',
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

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

    return {
      success: true,
      record: newRecord,
    };
  }
}
