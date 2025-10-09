import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user';
import recipeRoutes from './routes/recipe';
import pantryRoutes from './routes/pantry';
import itemCategoryRoutes from './routes/item-category';
import { clerkMiddleware } from '@clerk/express'

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/user', userRoutes);
app.use('/recipes', recipeRoutes);
app.use('/pantry', pantryRoutes);
app.use('/item-categories', itemCategoryRoutes);

export default app;
