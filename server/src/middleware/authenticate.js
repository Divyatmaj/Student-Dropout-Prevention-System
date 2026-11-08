/**
 * Require a valid `Authorization: Bearer <token>`.
 *
 * Reloads the user from the database on every request, so deactivated
 * accounts and role changes apply immediately (not when the token expires).
 * Sets req.user = { id, name, email, role, isActive, schoolId, schoolName }.
 */
import { getPrisma } from '../config/prisma.js';
import { unauthorized } from '../utils/AppError.js';
import { verifyToken } from '../utils/tokens.js';
import { PUBLIC_USER_SELECT, toPublicUser } from '../utils/users.js';

export async function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  const claims = verifyToken(token);
  const user = await getPrisma().user.findUnique({ where: { id: claims.sub }, select: PUBLIC_USER_SELECT });

  // Same message for every case so the response does not reveal account state.
  if (!user || !user.isActive || !user.schoolId) {
    throw unauthorized('Your session is not valid. Please sign in again.');
  }
  req.user = toPublicUser(user);
  next();
}
