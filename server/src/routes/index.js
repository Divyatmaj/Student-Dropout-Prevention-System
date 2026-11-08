import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import studentRoutes from './students.routes.js';
import attendanceRoutes from './attendance.routes.js';
import assessmentRoutes from './assessments.routes.js';
import markRoutes from './marks.routes.js';
import riskRoutes from './risk.routes.js';
import interventionRoutes from './interventions.routes.js';
import dashboardRoutes from './dashboard.routes.js';

/**
 * Udaan API v1 router, mounted at /api/v1.
 * Every route except /health and /auth/login requires a signed-in user.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marks', markRoutes);
router.use('/risk', riskRoutes);
router.use('/interventions', interventionRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
