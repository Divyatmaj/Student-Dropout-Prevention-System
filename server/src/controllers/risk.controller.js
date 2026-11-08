import * as risk from '../services/risk.service.js';
import { sendSuccess } from '../utils/response.js';

const v = (req) => req.validated;

export const overview = async (req, res) => sendSuccess(res, await risk.getOverview(req.user));
export const list = async (req, res) => sendSuccess(res, await risk.listRisk(req.user, v(req).query));
export const get = async (req, res) => sendSuccess(res, await risk.getStudentRisk(req.user, v(req).params.studentId));
export const recalculateOne = async (req, res) => sendSuccess(res, await risk.recalculateOne(req.user, v(req).params.studentId));
export const recalculateAll = async (req, res) => sendSuccess(res, await risk.recalculateAll(req.user));
export const review = async (req, res) =>
  sendSuccess(res, await risk.markReviewed(req.user, v(req).params.studentId, v(req).body.note), { message: 'Marked as reviewed.' });
