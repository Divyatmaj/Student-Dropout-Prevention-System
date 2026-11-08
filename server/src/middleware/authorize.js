/**
 * Require one of the given permissions (from the shared permission table).
 * Use after authenticate. Record-level rules (school scope, ownership) are
 * enforced in the services.
 *
 *   router.post('/', authorize(PERMISSIONS.STAFF_MANAGE), controller.create)
 */
import { can } from '@udaan/shared';

import { forbidden } from '../utils/AppError.js';

export function authorize(...permissions) {
  return (req, res, next) => {
    if (!permissions.some((p) => can(req.user, p))) throw forbidden();
    next();
  };
}
