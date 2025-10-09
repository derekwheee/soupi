import { Request, Response } from 'express';
import * as recipeService from '../services/recipe';
import { controller } from './helpers';

export async function createRecipe(req: Request, res: Response) {
    return await controller(req, res, (userId: string) => recipeService.createRecipe(userId, req.body));
}

export async function createRecipeFromUrl(req: Request, res: Response) {
    return await controller(req, res, async (userId: string) => {
        const queryUrl = (req.query && (req.query.url as string)) as string | undefined;

        if (!queryUrl || typeof queryUrl !== 'string') {
            return res.status(400).json({ error: 'url query parameter is required' });
        }

        // Decode if encoded; decodeURIComponent is a no-op for plain strings
        let url: string;
        try {
            url = decodeURIComponent(queryUrl);
        } catch (e) {
            url = queryUrl;
        }

        return await recipeService.createRecipeFromUrl(userId, url);
    });
}

export async function getAllRecipes(req: Request, res: Response) {
    return await controller(req, res, (userId: string) => recipeService.getAllRecipes(userId));
}

export async function getRecipe(req: Request, res: Response) {
    return await controller(req, res, (userId: string) => recipeService.getRecipe(userId, Number(req.params.id)));
}