import { apiClient, ApiError, USE_MOCKS, mockDelay } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { mockUsers } from '../data/mockUsersData.js';
import { mockParentMeetingLogs } from '../data/mockParentMeetingLogs.js';

function mockStudentInScope(studentId) {
  const student = mockStudentsList.find((row) => row.id === studentId);
  const user = getMockSessionUser();
  if (!student || (user?.role === 'TEACHER' && student.assignedTeacherId !== user.id)) {
    throw new ApiError({ status: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' });
  }
  return { student, user };
}

export async function getParentMeetings(studentId) {
  if (!USE_MOCKS) return apiClient(`/students/${studentId}/parent-meetings`);
  await mockDelay(200);
  mockStudentInScope(studentId);
  return mockParentMeetingLogs
    .filter((meeting) => meeting.studentId === studentId)
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate) || b.createdAt.localeCompare(a.createdAt));
}

export async function createParentMeeting(studentId, payload) {
  if (!USE_MOCKS) {
    return apiClient(`/students/${studentId}/parent-meetings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  await mockDelay(250);
  const { user } = mockStudentInScope(studentId);
  const creator = mockUsers.find((row) => row.id === user?.id);
  const meeting = {
    id: `MEET-${Date.now()}`,
    studentId,
    ...payload,
    followUpActions: payload.followUpActions || '',
    createdAt: new Date().toISOString(),
    createdById: user?.id ?? null,
    createdByName: creator?.name ?? user?.name ?? 'Staff',
  };
  mockParentMeetingLogs.push(meeting);
  return meeting;
}
