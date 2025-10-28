import { Request, Response } from 'express';
import * as categoryService from '../services/category';
import { householdController } from './helpers';
import { Household } from '@prisma/client';

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

export async function upsertCategory(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, (household: Household) =>
        categoryService.upsertCategory(household.id, Number(pantryId), req.body),
    );
}

export async function updateSortOrder(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, (household: Household) =>
        categoryService.updateSortOrder(
            household.id,
            Number(pantryId),
            req.body,
        ),
    );
}
