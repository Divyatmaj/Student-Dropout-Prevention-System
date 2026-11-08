import * as interventions from '../services/intervention.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

const v = (req) => req.validated;

export const overview = async (req, res) => sendSuccess(res, await interventions.getOverview(req.user));
export const list = async (req, res) => sendSuccess(res, await interventions.listInterventions(req.user, v(req).query));
export const get = async (req, res) => sendSuccess(res, await interventions.getIntervention(req.user, v(req).params.id));
export const create = async (req, res) => sendCreated(res, await interventions.createIntervention(req.user, v(req).body));
export const update = async (req, res) => sendSuccess(res, await interventions.updateIntervention(req.user, v(req).params.id, v(req).body));
export const changeStatus = async (req, res) => sendSuccess(res, await interventions.changeStatus(req.user, v(req).params.id, v(req).body));
