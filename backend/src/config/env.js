import 'dotenv/config';
const required = ['DB_HOST','DB_USER','DB_NAME','SESSION_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
export const env = {
  port: Number(process.env.PORT || 8090),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  db: { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME, connectionLimit: 10, ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined },
  sessionSecret: process.env.SESSION_SECRET,
  secureCookie: process.env.SESSION_COOKIE_SECURE === 'true',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};
