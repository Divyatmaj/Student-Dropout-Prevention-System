import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export async function login(req, res) {
  sendSuccess(res, await authService.login(req.validated.body));
}

export function me(req, res) {
  sendSuccess(res, req.user);
}
