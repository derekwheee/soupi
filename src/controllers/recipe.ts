import { Request, Response } from 'express';
import { recipeService } from '../services/recipe';

export async function createRecipe(req: Request, res: Response) {
    try {
        const data = req.body;
        const recipe = await recipeService.createRecipe(data);
        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not create recipe' });
    }
}

export async function getAllRecipes(req: Request, res: Response) {
    try {
        const recipes = await recipeService.getAllRecipes();
        res.json(recipes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
}

export async function getRecipe(req: Request, res: Response) {
    try {
        const recipe = await recipeService.getRecipe(Number(req.params.id));
        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
}

export async function parseIngredients(req: Request, res: Response) {
    try {
        const recipeId = Number(req.params.id);
        const recipe = await recipeService.parseIngredients(recipeId);
        res.json(recipe)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to parse recipe ingredients' });
    }
}