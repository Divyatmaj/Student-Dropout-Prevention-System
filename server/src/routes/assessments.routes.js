import { Router } from 'express';
import { PERMISSIONS as P } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import * as s from '../validators/academic.validator.js';
import * as c from '../controllers/academics.controller.js';

const router = Router();
router.use(authenticate);

router.get('/overview', authorize(P.ACADEMICS_VIEW), c.overview);
router.get('/', authorize(P.ACADEMICS_VIEW), validate({ query: s.listAssessmentsQuery }), c.list);
router.post('/', authorize(P.ASSESSMENT_CREATE), validate({ body: s.createAssessmentSchema }), c.create);
router.get('/:id', authorize(P.ACADEMICS_VIEW), validate({ params: idParam }), c.get);
// Creator or school admin — checked in the service.
router.patch('/:id', authorize(P.ASSESSMENT_CREATE), validate({ params: idParam, body: s.updateAssessmentSchema }), c.update);
router.delete('/:id', authorize(P.ASSESSMENT_DELETE), validate({ params: idParam }), c.remove);

export default router;
