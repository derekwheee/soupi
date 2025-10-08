import { PantryItem } from '@prisma/client';
import prisma from '../../prisma';

export async function getAllPantryItems(): Promise<PantryItem[]> {
    return prisma.pantryItem.findMany({
        include: { category: true }
    });
};

export async function getPantryItem(id: number): Promise<PantryItem> {
    return prisma.pantryItem.findUniqueOrThrow({
        where: { id },
        include: { category: true }
    });
};

export async function upsertPantryItem(item: PantryItem): Promise<PantryItem> {
    const { id, ...data } = item;

    if (id) {
        const existing = await prisma.pantryItem.findUnique({ where: { id } });
        if (existing) {
            return prisma.pantryItem.update({ where: { id }, data });
        }
    }

    return prisma.pantryItem.create({ data });
}