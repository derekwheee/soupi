import { Request, Response } from 'express';
import { pantryService } from '../services/pantry';

export async function getAllPantryItems(req: Request, res: Response) {
    try {
        const pantry = await pantryService.getAllPantryItems();
        res.json(pantry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pantry' });
    }
}