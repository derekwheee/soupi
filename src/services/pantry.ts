import { PantryItem } from '@prisma/client';
import prisma from '../../prisma';

export const pantryService = {
    getAllPantryItems: async (): Promise<PantryItem[]> =>
        prisma.pantryItem.findMany()
};