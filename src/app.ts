import express from 'express';
import recipeRoutes from './routes/recipe';
import pantryRoutes from './routes/pantry';

const app = express();

app.use(express.json());

app.use('/recipes', recipeRoutes);
app.use('/pantry', pantryRoutes);

export default app;
