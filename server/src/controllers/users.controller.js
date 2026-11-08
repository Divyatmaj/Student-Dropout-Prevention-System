import * as userService from '../services/user.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export async function list(req, res) {
  sendSuccess(res, await userService.listUsers(req.user, req.validated.query));
}

export async function assignable(req, res) {
  sendSuccess(res, await userService.listAssignable(req.user));
}

export async function get(req, res) {
  sendSuccess(res, await userService.getUser(req.user, req.validated.params.id));
}

export async function create(req, res) {
  sendCreated(res, await userService.createUser(req.user, req.validated.body), 'Staff account created.');
}

export async function update(req, res) {
  sendSuccess(res, await userService.updateUser(req.user, req.validated.params.id, req.validated.body));
}

export async function setStatus(req, res) {
  sendSuccess(res, await userService.setUserStatus(req.user, req.validated.params.id, req.validated.body.isActive));
}
