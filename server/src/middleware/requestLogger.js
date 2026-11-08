/** Minimal development request log: method, path, status, duration. No bodies or query values. */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const path = req.originalUrl.split('?')[0]; // read now: routers rewrite req.url while matching
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${path} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
}
