/**
 * Vercel serverless entry for the Udaan API.
 *
 * vercel.json rewrites every /api/* request here; the Express app keeps the
 * original URL, so its /api/v1 routes match as they do locally.
 */
import app from '../server/src/app.js';

export default app;
