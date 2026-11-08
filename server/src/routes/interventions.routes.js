import { Router } from 'express';
import { PERMISSIONS as P } from '@udaan/shared';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import * as s from '../validators/intervention.validator.js';
import * as c from '../controllers/interventions.controller.js';

const router = Router();
router.use(authenticate);

router.get('/overview', authorize(P.INTERVENTIONS_VIEW), c.overview);
router.get('/', authorize(P.INTERVENTIONS_VIEW), validate({ query: s.listInterventionsQuery }), c.list);
router.post('/', authorize(P.INTERVENTION_CREATE), validate({ body: s.createInterventionSchema }), c.create);
router.get('/:id', authorize(P.INTERVENTIONS_VIEW), validate({ params: idParam }), c.get);
// Creator, owner, principal or school admin — checked in the service.
router.patch('/:id', authorize(P.INTERVENTION_UPDATE), validate({ params: idParam, body: s.updateInterventionSchema }), c.update);
router.patch('/:id/status', authorize(P.INTERVENTION_UPDATE), validate({ params: idParam, body: s.statusSchema }), c.changeStatus);

export default router;
