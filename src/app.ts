import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user';
import householdRoutes from './routes/household';
import recipeRoutes from './routes/recipe';
import pantryRoutes from './routes/pantry';
import shoppingListRoutes from './routes/shopping-list';
import categoryRoutes from './routes/category';
import metaRoutes from './routes/meta';
import eventRoutes from './routes/events';
import aiRoutes from './routes/ai';
import { clerkMiddleware } from '@clerk/express'

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware({ debug: true }));

app.use('/meta', metaRoutes);
app.use('/user', userRoutes);
app.use('/', householdRoutes);
app.use('/', recipeRoutes);
app.use('/', pantryRoutes);
app.use('/', shoppingListRoutes);
app.use('/', categoryRoutes);
app.use('/events', eventRoutes);
app.use('/ai', aiRoutes);

export default app;
