/** Send the standard success envelope: { success: true, data, message? }. */
export function sendSuccess(res, data = null, { status = 200, message } = {}) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

export function sendCreated(res, data, message) {
  return sendSuccess(res, data, { status: 201, message });
}
