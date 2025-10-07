import express from 'express';
import cors from 'cors';
import recipeRoutes from './routes/recipe';
import pantryRoutes from './routes/pantry';
import itemCategoryRoutes from './routes/item-category';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/recipes', recipeRoutes);
app.use('/pantry', pantryRoutes);
app.use('/item-categories', itemCategoryRoutes);

export default app;
