/** Fields selected for any user returned by the API (never the password hash). */
export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  schoolId: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { name: true, code: true } },
};

export function toPublicUser(user) {
  if (!user) return null;
  const { school, passwordHash, ...rest } = user; // eslint-disable-line no-unused-vars
  return { ...rest, schoolName: school?.name ?? null, schoolCode: school?.code ?? null };
}
