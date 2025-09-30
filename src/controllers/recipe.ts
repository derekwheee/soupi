import { Request, Response } from 'express';
import { recipeService } from '../services/recipe';

export async function listRecipes(req: Request, res: Response) {
    try {
        const recipes = await recipeService.getAllRecipes();
        res.json(recipes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
}

export async function parseIngredients(req: Request, res: Response) {
    try {
        const recipe = await recipeService.parseIngredients(1);
        res.json(recipe)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
}