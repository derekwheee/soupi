import { Request, Response } from 'express';
import * as recipeService from '../services/recipe';
import { householdController } from './helpers';
import { Household } from '@prisma/client';

export async function createRecipeFromUrl(req: Request, res: Response) {
    return await householdController(req, res, async (household: Household) => {
        const queryUrl = (req.query && (req.query.url as string)) as
            | string
            | undefined;

        if (!queryUrl || typeof queryUrl !== 'string') {
            return res
                .status(400)
                .json({ error: 'url query parameter is required' });
        }

        // Decode if encoded; decodeURIComponent is a no-op for plain strings
        let url: string;
        try {
            url = decodeURIComponent(queryUrl);
        } catch (e) {
            url = queryUrl;
        }

        return await recipeService.createRecipeFromUrl(household.id, url);
    });
}

export async function getAllRecipes(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.getAllRecipes(household.id),
    );
}

export async function getRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.getRecipe(household.id, Number(req.params.id)),
    );
}

export async function upsertRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.upsertRecipe(household.id, req.body),
    );
}

export async function deleteRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.deleteRecipe(household.id, Number(req.params.id)),
    );
}

export async function getAllRecipeTags(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.getAllRecipeTags(household.id),
    );
}

export async function completeRecipe(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        recipeService.completeRecipe(household.id, req.body),
    );
}
