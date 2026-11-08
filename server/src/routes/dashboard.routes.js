import { Router } from 'express';
import { PERMISSIONS as P } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { dashboardQuery } from '../validators/dashboard.validator.js';
import * as c from '../controllers/dashboard.controller.js';

const router = Router();
router.use(authenticate);

router.get('/overview', authorize(P.DASHBOARD_SCHOOL_VIEW), validate({ query: dashboardQuery }), c.overview);
router.get('/teacher', authorize(P.DASHBOARD_TEACHER_VIEW), validate({ query: dashboardQuery }), c.overview);
router.get('/attention', authorize(P.DASHBOARD_VIEW), c.attention);

export default router;
