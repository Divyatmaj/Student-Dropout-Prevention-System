import { Router } from 'express';
import { PERMISSIONS as P } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import * as s from '../validators/attendance.validator.js';
import * as c from '../controllers/attendance.controller.js';

const router = Router();
router.use(authenticate);

router.get('/overview', authorize(P.ATTENDANCE_VIEW), validate({ query: s.overviewQuery }), c.overview);
router.get('/register', authorize(P.ATTENDANCE_VIEW), validate({ query: s.registerQuery }), c.register);
router.get('/student/:studentId', authorize(P.ATTENDANCE_VIEW), validate({ params: s.studentIdParam, query: s.studentAttendanceQuery }), c.forStudent);
router.get('/', authorize(P.ATTENDANCE_VIEW), validate({ query: s.listAttendanceQuery }), c.list);
router.post('/bulk', authorize(P.ATTENDANCE_RECORD), validate({ body: s.bulkAttendanceSchema }), c.bulk);
router.post('/', authorize(P.ATTENDANCE_RECORD), validate({ body: s.recordAttendanceSchema }), c.record);
router.patch('/:id', authorize(P.ATTENDANCE_RECORD), validate({ params: idParam, body: s.updateAttendanceSchema }), c.update);
router.delete('/:id', authorize(P.ATTENDANCE_DELETE), validate({ params: idParam, body: s.deleteAttendanceSchema }), c.remove);

export default router;
