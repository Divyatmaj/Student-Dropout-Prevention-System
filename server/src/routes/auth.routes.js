import { Router } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

import { env } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.validator.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

/**
 * Slow down password guessing: LOGIN_RATE_LIMIT failed attempts per IP +
 * email per 15 minutes (successful sign-ins don't count). The counter is in memory, so on serverless each instance
 * counts separately — enough for a prototype; use a shared store at scale.
 */
export function createLoginLimiter(limit = env.LOGIN_RATE_LIMIT) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${String(req.body?.email ?? '').trim().toLowerCase()}`,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
          details: [],
        },
      }),
  });
}

const loginLimiter = createLoginLimiter();

/** POST /api/v1/auth/login  { email, password } → { token, user } */
router.post('/login', loginLimiter, validate({ body: loginSchema }), auth.login);

/** GET /api/v1/auth/me → user */
router.get('/me', authenticate, auth.me);

export default router;
