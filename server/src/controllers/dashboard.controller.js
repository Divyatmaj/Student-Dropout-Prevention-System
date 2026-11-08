import * as dashboard from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export const overview = async (req, res) => sendSuccess(res, await dashboard.getOverview(req.user, req.validated.query));
export const attention = async (req, res) => sendSuccess(res, await dashboard.getAttention(req.user));
