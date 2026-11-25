export function notFound(req,res) { res.status(404).json({ error: 'Endpoint not found.' }); }
export function errorHandler(err,req,res,next) {
  if (res.headersSent) return next(err);
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is too large. Maximum size is 8 MB.' });
  if (err?.name === 'ZodError') return res.status(400).json({ error: 'Validation failed.', details: err.issues.map(i => ({path:i.path.join('.'),message:i.message})) });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'An unexpected server error occurred.' });
}
