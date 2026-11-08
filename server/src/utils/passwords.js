import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(password) {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Compared against when the email is unknown, so a failed login takes the
// same time whether or not the account exists.
let dummyHash;
export async function burnPasswordCheck(password) {
  dummyHash ??= await bcrypt.hash('udaan-timing-equaliser', env.BCRYPT_ROUNDS);
  await bcrypt.compare(password, dummyHash);
  return false;
}
