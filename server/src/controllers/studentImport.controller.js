import * as studentImport from '../services/studentImport.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const preview = async (req, res) =>
  sendSuccess(res, await studentImport.previewStudentImport(req.user, req.validated.body.rows));

export const commit = async (req, res) =>
  sendCreated(res, await studentImport.importStudents(req.user, req.validated.body.rows), 'Students imported.');
