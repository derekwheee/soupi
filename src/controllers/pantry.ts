import { Request, Response } from 'express';
import * as pantryService from '../services/pantry';
import { controller } from './helpers';

export async function getAllPantryItems(req: Request, res: Response) {
    return await controller(req, res, pantryService.getAllPantryItems);
}

export async function getPantryItem(req: Request, res: Response) {
    return await controller(req, res, () => pantryService.getPantryItem(Number(req.params.id)));
}

export async function upsertPantryItem(req: Request, res: Response) {
    return await controller(req, res, () => pantryService.upsertPantryItem(req.body));
}