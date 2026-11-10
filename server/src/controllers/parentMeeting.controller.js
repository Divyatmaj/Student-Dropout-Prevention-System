import * as meetings from '../services/parentMeeting.service.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

const v = (req) => req.validated;

export const list = async (req, res) =>
  sendSuccess(res, await meetings.listParentMeetings(req.user, v(req).params.id));

export const create = async (req, res) =>
  sendCreated(res, await meetings.createParentMeeting(req.user, v(req).params.id, v(req).body), 'Meeting recorded.');
