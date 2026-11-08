import * as academics from '../services/academic.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

const v = (req) => req.validated;

export const overview = async (req, res) => sendSuccess(res, await academics.getOverview(req.user));
export const list = async (req, res) => sendSuccess(res, await academics.listAssessments(req.user, v(req).query));
export const get = async (req, res) => sendSuccess(res, await academics.getAssessment(req.user, v(req).params.id));
export const create = async (req, res) => sendCreated(res, await academics.createAssessment(req.user, v(req).body));
export const update = async (req, res) => sendSuccess(res, await academics.updateAssessment(req.user, v(req).params.id, v(req).body));
export const remove = async (req, res) =>
  sendSuccess(res, await academics.deleteAssessment(req.user, v(req).params.id), { message: 'Assessment deleted.' });

export const saveMarks = async (req, res) => sendSuccess(res, await academics.saveMarks(req.user, v(req).body));
export const recordMark = async (req, res) => sendCreated(res, await academics.recordMark(req.user, v(req).body));
export const updateMark = async (req, res) => sendSuccess(res, await academics.updateMark(req.user, v(req).params.id, v(req).body));
export const removeMark = async (req, res) =>
  sendSuccess(res, await academics.deleteMark(req.user, v(req).params.id, v(req).body.reason), { message: 'Mark removed.' });
