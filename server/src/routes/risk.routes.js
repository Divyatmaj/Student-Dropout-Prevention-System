import { Router } from 'express';
import { PERMISSIONS as P } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { listRiskQuery, studentIdParam, reviewSchema } from '../validators/risk.validator.js';
import * as c from '../controllers/risk.controller.js';

const router = Router();
router.use(authenticate);

router.get('/overview', authorize(P.RISK_VIEW), c.overview);
router.get('/', authorize(P.RISK_VIEW), validate({ query: listRiskQuery }), c.list);
router.post('/recalculate', authorize(P.RISK_RECALCULATE_ALL), c.recalculateAll);
router.post('/recalculate/:studentId', authorize(P.RISK_RECALCULATE), validate({ params: studentIdParam }), c.recalculateOne);
router.get('/:studentId', authorize(P.RISK_VIEW), validate({ params: studentIdParam }), c.get);
router.post('/:studentId/review', authorize(P.RISK_REVIEW), validate({ params: studentIdParam, body: reviewSchema }), c.review);

export default router;
