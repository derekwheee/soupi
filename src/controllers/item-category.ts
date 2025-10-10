import { Request, Response } from 'express';
import * as itemCategoryService from '../services/item-category';
import { controller } from './helpers';

export async function getAllItemCategories(req: Request, res: Response) {
    return await controller(req, res, () => itemCategoryService.getItemCategories(Number(req.params.pantryId)));
}

export async function upsertItemCategory(req: Request, res: Response) {
    return await controller(req, res, () => itemCategoryService.upsertItemCategory(req.body));
}