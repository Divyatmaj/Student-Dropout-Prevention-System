import { getPrisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { verifyPassword, burnPasswordCheck } from '../utils/passwords.js';
import { signToken } from '../utils/tokens.js';
import { PUBLIC_USER_SELECT, toPublicUser } from '../utils/users.js';

// One message for unknown email, wrong password and disabled account, so a
// failed sign-in never reveals which accounts exist.
const invalidCredentials = () =>
  new AppError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });

export async function login({ email, password }) {
  const record = await getPrisma().user.findUnique({
    where: { email },
    select: { ...PUBLIC_USER_SELECT, passwordHash: true },
  });

  if (!record) {
    await burnPasswordCheck(password);
    throw invalidCredentials();
  }
  const passwordOk = await verifyPassword(password, record.passwordHash);
  if (!passwordOk || !record.isActive || !record.schoolId) throw invalidCredentials();

  const user = toPublicUser(record);
  return { token: signToken(user), user };
}
