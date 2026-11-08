import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Enter your email.').max(150),
  password: z.string().min(1, 'Enter your password.').max(200),
});
