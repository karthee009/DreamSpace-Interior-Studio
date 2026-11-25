
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import authRoutes from './modules/auth/auth.routes.js';
import businessRoutes from './modules/business/business.routes.js';
import { uploadPath } from './middleware/uploads.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(cors({
  origin: env.frontendOrigin,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({
  extended: false,
  limit: '1mb'
}));

// Serve uploaded images
app.use(
  '/uploads',
  express.static(uploadPath, {
    dotfiles: 'deny',
    index: false,
    fallthrough: false,
    maxAge: '1d',
    setHeaders(res, filePath) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (/\.jfif$/i.test(filePath)) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  })
);

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000,
  createDatabaseTable: true
}, pool);

app.use(session({
  name: 'dreamspace.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  proxy: env.secureCookie,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.secureCookie,
    maxAge: 86400000
  }
}));

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false
  }),
  authRoutes
);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected'
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'unavailable'
    });
  }
});

app.use('/api', businessRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
