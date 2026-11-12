import * as students from '../services/student.service.js';
import * as duplicates from '../services/studentDuplicate.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

const v = (req) => req.validated;

export const list = async (req, res) => sendSuccess(res, await students.listStudents(req.user, v(req).query));
export const get = async (req, res) => sendSuccess(res, await students.getStudent(req.user, v(req).params.id));
export const summary = async (req, res) => sendSuccess(res, await students.getStudentSummary(req.user, v(req).params.id));
export const create = async (req, res) => sendCreated(res, await students.createStudent(req.user, v(req).body), 'Student added.');
export const duplicateCheck = async (req, res) => sendSuccess(res, await duplicates.findPossibleDuplicates(req.user, v(req).body));
export const update = async (req, res) => sendSuccess(res, await students.updateStudent(req.user, v(req).params.id, v(req).body));
export const setStatus = async (req, res) =>
  sendSuccess(res, await students.setStudentStatus(req.user, v(req).params.id, v(req).body.status));
