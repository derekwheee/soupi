import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user';
import recipeRoutes from './routes/recipe';
import pantryRoutes from './routes/pantry';
import metaRoutes from './routes/meta';
import { clerkMiddleware } from '@clerk/express'

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/meta', metaRoutes);
app.use('/user', userRoutes);
app.use('/recipes', recipeRoutes);
app.use('/pantry', pantryRoutes);

export default app;
