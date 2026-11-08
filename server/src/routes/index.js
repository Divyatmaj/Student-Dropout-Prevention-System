import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './users.routes.js';
import studentRoutes from './students.routes.js';
import attendanceRoutes from './attendance.routes.js';
import assessmentRoutes from './assessments.routes.js';
import markRoutes from './marks.routes.js';

/**
 * Udaan API v1 router, mounted at /api/v1.
 * Resource routers (auth, users, students, attendance, assessments, marks,
 * risk, interventions, dashboard) are added here as they are implemented.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marks', markRoutes);

export default router;
