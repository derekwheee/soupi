import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import pinoHttp from 'pino-http';

import logger from '../utils/logger';
import aiRoutes from './routes/ai';
import categoryRoutes from './routes/category';
import eventRoutes from './routes/events';
import healthRoutes from './routes/health';
import householdRoutes from './routes/household';
import metaRoutes from './routes/meta';
import pantryRoutes from './routes/pantry';
import planRoutes from './routes/plan';
import recipeRoutes from './routes/recipe';
import shoppingListRoutes from './routes/shopping-list';
import userRoutes from './routes/user';

const app = express();

// Strict rate limit for AI endpoints (OpenAI cost protection)
const aiRateLimit = rateLimit({
    legacyHeaders: false,
    limit: 10,
    message: { error: 'Too many AI requests, please try again later.' },
    standardHeaders: 'draft-8',
    windowMs: 15 * 60 * 1000,
});

// General rate limit for all other routes
const generalRateLimit = rateLimit({
    legacyHeaders: false,
    limit: 300,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: 'draft-8',
    windowMs: 15 * 60 * 1000,
});

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(clerkMiddleware({ debug: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/health', healthRoutes);
app.use('/meta', metaRoutes);
app.use('/user', generalRateLimit, userRoutes);
app.use('/', generalRateLimit, householdRoutes);
app.use('/', generalRateLimit, recipeRoutes);
app.use('/', generalRateLimit, pantryRoutes);
app.use('/', generalRateLimit, shoppingListRoutes);
app.use('/', generalRateLimit, categoryRoutes);
app.use('/', generalRateLimit, planRoutes);
app.use('/events', generalRateLimit, eventRoutes);
app.use('/ai', aiRateLimit, aiRoutes);

export default app;
