import { Request, Response } from 'express';
import * as pantryService from '../services/pantry';
import { controller } from './helpers';

export async function getPantries(req: Request, res: Response) {
    return await controller(req, res, (userId: string) => pantryService.getPantries(userId));
}

export async function upsertPantryItem(req: Request, res: Response) {
    return await controller(req, res, () => pantryService.upsertPantryItem(req.body));
}

export async function getAllPantryItems(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await controller(req, res, () => pantryService.getAllPantryItems(Number(pantryId)));
}

export async function getPantryItem(req: Request, res: Response) {
    const { pantryId, itemId } = req.params;
    return await controller(req, res, () => pantryService.getPantryItem(Number(pantryId), Number(itemId)));
}

export async function getPantryCategories(req: Request, res: Response) {
    const { pantryId } = req.params;
    return await controller(req, res, () => pantryService.getPantryCategories(Number(pantryId)));
}