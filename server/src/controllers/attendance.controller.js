import * as attendance from '../services/attendance.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

const v = (req) => req.validated;

export const overview = async (req, res) => sendSuccess(res, await attendance.getOverview(req.user, v(req).query));
export const list = async (req, res) => sendSuccess(res, await attendance.listRecords(req.user, v(req).query));
export const register = async (req, res) => sendSuccess(res, await attendance.getRegister(req.user, v(req).query));
export const forStudent = async (req, res) =>
  sendSuccess(res, await attendance.getStudentAttendance(req.user, v(req).params.studentId, v(req).query));
export const record = async (req, res) => sendCreated(res, await attendance.recordAttendance(req.user, v(req).body));
export const bulk = async (req, res) => sendSuccess(res, await attendance.saveRegister(req.user, v(req).body));
export const update = async (req, res) => sendSuccess(res, await attendance.updateRecord(req.user, v(req).params.id, v(req).body));
export const remove = async (req, res) =>
  sendSuccess(res, await attendance.deleteRecord(req.user, v(req).params.id, v(req).body.reason), { message: 'Attendance record removed.' });
