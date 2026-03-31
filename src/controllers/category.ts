import { Household } from '@prisma/client';
import { Request, Response } from 'express';

import { UpdateSortOrderSchema, UpsertCategorySchema } from '../schemas';
import * as categoryService from '../services/category';
import { householdController, parseBody } from './helpers';

export async function getCategories(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, () =>
        categoryService.getCategories(Number(pantryId)),
    );
}

export async function getCategory(req: Request, res: Response) {
    const { categoryId, pantryId } = req.params;
    return await householdController(req, res, () =>
        categoryService.getCategory(Number(pantryId), Number(categoryId)),
    );
}

export async function updateSortOrder(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, (household: Household) => {
        const body = parseBody(res, UpdateSortOrderSchema, req.body);
        if (!body) return;
        return categoryService.updateSortOrder(
            household.id,
            Number(pantryId),
            body,
        );
    });
}

export async function upsertCategory(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, (household: Household) => {
        const body = parseBody(res, UpsertCategorySchema, req.body);
        if (!body) return;
        return categoryService.upsertCategory(household.id, Number(pantryId), body);
    });
}
