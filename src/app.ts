import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import v1Routes from './routes/v1';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Rate Limiting
app.use('/api', rateLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Swagger (Placeholder)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({
  openapi: '3.0.0',
  info: { title: 'Node.js CRUD API', version: '1.0.0' },
  paths: {}
}));

// Routes
app.use('/api/v1', v1Routes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Centralized Error Handler
app.use(errorHandler);

export { app };
