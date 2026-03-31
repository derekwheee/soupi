import path from 'path';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from '../utils/logger';
import userRoutes from './routes/user';
import householdRoutes from './routes/household';
import recipeRoutes from './routes/recipe';
import pantryRoutes from './routes/pantry';
import shoppingListRoutes from './routes/shopping-list';
import categoryRoutes from './routes/category';
import metaRoutes from './routes/meta';
import eventRoutes from './routes/events';
import planRoutes from './routes/plan';
import aiRoutes from './routes/ai';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// Strict rate limit for AI endpoints (OpenAI cost protection)
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many AI requests, please try again later.' },
});

// General rate limit for all other routes
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(clerkMiddleware({ debug: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
