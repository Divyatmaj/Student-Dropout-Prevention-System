/** School and teacher scoped parent or guardian meeting notes. */
import { getPrisma } from '../config/prisma.js';
import { fromDbDate, toDbDate } from '../utils/dates.js';
import { findStudentInScope } from './scope.js';

const toParentMeeting = (meeting) => ({
  id: meeting.id,
  studentId: meeting.studentId,
  meetingDate: fromDbDate(meeting.meetingDate),
  attendees: meeting.attendees,
  notes: meeting.notes,
  followUpActions: meeting.followUpActions ?? '',
  followUpDate: fromDbDate(meeting.followUpDate),
  createdAt: meeting.createdAt,
  createdById: meeting.createdById,
  createdByName: meeting.createdBy?.name ?? null,
});

export async function listParentMeetings(user, studentId) {
  await findStudentInScope(user, studentId);
  const meetings = await getPrisma().parentMeetingLog.findMany({
    where: { schoolId: user.schoolId, studentId },
    include: { createdBy: { select: { name: true } } },
    orderBy: [{ meetingDate: 'desc' }, { createdAt: 'desc' }],
  });
  return meetings.map(toParentMeeting);
}

export async function createParentMeeting(user, studentId, values) {
  await findStudentInScope(user, studentId);
  const meeting = await getPrisma().parentMeetingLog.create({
    data: {
      schoolId: user.schoolId,
      studentId,
      createdById: user.id,
      meetingDate: toDbDate(values.meetingDate),
      attendees: values.attendees,
      notes: values.notes,
      followUpActions: values.followUpActions || null,
      followUpDate: toDbDate(values.followUpDate),
    },
    include: { createdBy: { select: { name: true } } },
  });
  return toParentMeeting(meeting);
}
