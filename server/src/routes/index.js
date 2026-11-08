import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';

/**
 * Udaan API v1 router, mounted at /api/v1.
 * Resource routers (auth, users, students, attendance, assessments, marks,
 * risk, interventions, dashboard) are added here as they are implemented.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
