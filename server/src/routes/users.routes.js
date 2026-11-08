import { Router } from 'express';
import { PERMISSIONS } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import { listUsersQuery, createUserSchema, updateUserSchema, userStatusSchema } from '../validators/user.validator.js';
import * as users from '../controllers/users.controller.js';

const router = Router();
router.use(authenticate);

// Staff list and details: school admin and principal.
router.get('/', authorize(PERMISSIONS.STAFF_VIEW), validate({ query: listUsersQuery }), users.list);
// Owners for interventions: any staff member who can create or update one.
router.get('/assignable', authorize(PERMISSIONS.INTERVENTION_CREATE, PERMISSIONS.INTERVENTION_UPDATE), users.assignable);
router.get('/:id', authorize(PERMISSIONS.STAFF_VIEW), validate({ params: idParam }), users.get);

// Changes: school admin only.
router.post('/', authorize(PERMISSIONS.STAFF_MANAGE), validate({ body: createUserSchema }), users.create);
router.patch('/:id', authorize(PERMISSIONS.STAFF_MANAGE), validate({ params: idParam, body: updateUserSchema }), users.update);
router.patch('/:id/status', authorize(PERMISSIONS.STAFF_MANAGE), validate({ params: idParam, body: userStatusSchema }), users.setStatus);

export default router;
