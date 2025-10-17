import { Request, Response } from 'express';
import * as pantryService from '../services/pantry';
import { householdController } from './helpers';
import { Household } from '@prisma/client';

export async function getPantries(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        pantryService.getPantries(household.id),
    );
}

export async function upsertPantryItem(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, (household: Household) =>
        pantryService.upsertPantryItem(household.id, {
            pantryId: Number(pantryId),
            ...req.body,
        }),
    );
}

export async function getAllPantryItems(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, (household: Household) =>
        pantryService.getAllPantryItems(household.id, Number(pantryId)),
    );
}

export async function getPantryItem(req: Request, res: Response) {
    const { pantryId, itemId } = req.params;
    return await householdController(req, res, (household: Household) =>
        pantryService.getPantryItem(
            household.id,
            Number(pantryId),
            Number(itemId),
        ),
    );
}

export async function getPantryCategories(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, () =>
        pantryService.getPantryCategories(Number(pantryId)),
    );
}
