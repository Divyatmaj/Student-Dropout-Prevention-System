/**
 * Role-based permissions for the Udaan web app.
 *
 * The table lives in @udaan/shared so the API enforces exactly the same
 * rules. This only controls what the UI shows; the API is the authority.
 */
export {
  ROLES,
  ROLE_LABELS,
  PERMISSIONS,
  can,
  canCorrectAttendance,
  canManageIntervention,
} from '@udaan/shared';
