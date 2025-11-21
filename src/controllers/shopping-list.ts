import { Request, Response } from 'express';
import * as shoppingListService from '../services/shopping-list';
import { householdController } from './helpers';

export async function getListByCategory(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await householdController(req, res, () =>
        shoppingListService.getListByCategory(Number(pantryId)),
    );
}
