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

router.post('/bulk', authorize(P.MARKS_RECORD), validate({ body: s.bulkMarksSchema }), c.saveMarks);
router.post('/', authorize(P.MARKS_RECORD), validate({ body: s.recordMarkSchema }), c.recordMark);
router.patch('/:id', authorize(P.MARKS_RECORD), validate({ params: idParam, body: s.updateMarkSchema }), c.updateMark);
router.delete('/:id', authorize(P.MARKS_DELETE), validate({ params: idParam, body: s.deleteMarkSchema }), c.removeMark);

export default router;
