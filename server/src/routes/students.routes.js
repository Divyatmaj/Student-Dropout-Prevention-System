import { Router } from 'express';
import { PERMISSIONS as P } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import { listStudentsQuery, createStudentSchema, updateStudentSchema, studentStatusSchema } from '../validators/student.validator.js';
import { createParentMeetingSchema } from '../validators/parentMeeting.validator.js';
import { studentImportRowsSchema } from '../validators/studentImport.validator.js';
import * as c from '../controllers/students.controller.js';
import * as meetingController from '../controllers/parentMeeting.controller.js';
import * as importController from '../controllers/studentImport.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(P.STUDENTS_VIEW), validate({ query: listStudentsQuery }), c.list);
router.post('/', authorize(P.STUDENT_CREATE), validate({ body: createStudentSchema }), c.create);
router.post('/import/preview', authorize(P.STUDENT_IMPORT), validate({ body: studentImportRowsSchema }), importController.preview);
router.post('/import', authorize(P.STUDENT_IMPORT), validate({ body: studentImportRowsSchema }), importController.commit);
router.get('/:id', authorize(P.STUDENTS_VIEW), validate({ params: idParam }), c.get);
router.get('/:id/summary', authorize(P.STUDENTS_VIEW), validate({ params: idParam }), c.summary);
router.get('/:id/parent-meetings', authorize(P.PARENT_MEETINGS_VIEW), validate({ params: idParam }), meetingController.list);
router.post('/:id/parent-meetings', authorize(P.PARENT_MEETINGS_CREATE), validate({ params: idParam, body: createParentMeetingSchema }), meetingController.create);
router.patch('/:id', authorize(P.STUDENT_UPDATE), validate({ params: idParam, body: updateStudentSchema }), c.update);
router.patch('/:id/status', authorize(P.STUDENT_CHANGE_STATUS), validate({ params: idParam, body: studentStatusSchema }), c.setStatus);

export default router;
