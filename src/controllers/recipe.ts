import { Household } from '@prisma/client';
import { Request, Response } from 'express';

import { CompleteRecipeSchema, UpsertRecipeSchema } from '../schemas';
import * as recipeService from '../services/recipe';
import { householdController, parseBody } from './helpers';

export async function completeRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) => {
        const body = parseBody(res, CompleteRecipeSchema, req.body);
        if (!body) return;
        return recipeService.completeRecipe(household.id, body);
    });
}

export async function createRecipeFromUrl(req: Request, res: Response) {
    return await householdController(req, res, async (household: Household) => {
        const queryUrl = (req.query && (req.query.url as string)) as string | undefined;

        if (!queryUrl || typeof queryUrl !== 'string') {
            return res.status(400).json({ error: 'url query parameter is required' });
        }

        // Decode if encoded; decodeURIComponent is a no-op for plain strings
        let url: string;
        try {
            url = decodeURIComponent(queryUrl);
        } catch (_e) {
            url = queryUrl;
        }

        return await recipeService.createRecipeFromUrl(household.id, url);
    });
}

export async function deleteRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.deleteRecipe(household.id, Number(req.params.id)),
    );
}

export async function getAllRecipes(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) => {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
        return recipeService.getAllRecipes(household.id, { limit, page });
    });
}

export async function getAllRecipeTags(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.getAllRecipeTags(household.id),
    );
}

export async function getRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.getRecipe(household.id, Number(req.params.id)),
    );
}

export async function upsertRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) => {
        const body = parseBody(res, UpsertRecipeSchema, req.body);
        if (!body) return;
        return recipeService.upsertRecipe(household.id, body);
    });
}
