import express from 'express';
import recipeRoutes from './routes/recipe';

const app = express();

app.use(express.json());

// mount recipe routes under /recipes
app.use('/recipes', recipeRoutes);

export default app;
