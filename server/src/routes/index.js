import { Router } from 'express';

import healthRoutes from './health.routes.js';

/**
 * Udaan API v1 router, mounted at /api/v1.
 * Resource routers (auth, users, students, attendance, assessments, marks,
 * risk, interventions, dashboard) are added here as they are implemented.
 */
const router = Router();

router.use('/health', healthRoutes);

export default router;
