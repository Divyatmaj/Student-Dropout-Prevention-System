import { getPrisma } from '../config/prisma.js';

function normalizeName(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function similarity(left, right) {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return 0;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

/** Find likely matching profiles within the caller's school. */
export async function findPossibleDuplicates(user, values) {
  const fullName = normalizeName(values.fullName);
  const guardianName = normalizeName(values.guardianName);
  const guardianPhone = String(values.guardianPhone ?? '').replace(/\D/g, '');
  const or = [{ fullName: { equals: values.fullName.trim(), mode: 'insensitive' } }];
  if (guardianName) or.push({ guardianName: { equals: values.guardianName.trim(), mode: 'insensitive' } });
  if (guardianPhone) or.push({ guardianPhone });

  const candidates = await getPrisma().student.findMany({
    where: { schoolId: user.schoolId, OR: or },
    select: { id: true, studentCode: true, fullName: true, grade: true, section: true, guardianName: true, guardianPhone: true },
    orderBy: { fullName: 'asc' },
    take: 100,
  });

  const matches = candidates.flatMap((student) => {
    const sameName = normalizeName(student.fullName) === fullName;
    const sameGuardianName = Boolean(guardianName) && normalizeName(student.guardianName) === guardianName;
    const sameGuardianPhone = Boolean(guardianPhone) && String(student.guardianPhone ?? '').replace(/\D/g, '') === guardianPhone;
    const similarName = similarity(student.fullName, values.fullName) >= 0.72;
    if (!sameName && !(similarName && (sameGuardianName || sameGuardianPhone))) return [];
    const reason = sameName
      ? (sameGuardianName || sameGuardianPhone ? 'Student name and guardian details match.' : 'Student name matches an existing profile.')
      : 'Guardian details match and the student names are similar.';
    return [{
      id: student.id,
      studentCode: student.studentCode,
      fullName: student.fullName,
      grade: student.grade,
      section: student.section,
      guardianName: student.guardianName,
      reason,
    }];
  });

  return { matches: matches.slice(0, 5) };
}
