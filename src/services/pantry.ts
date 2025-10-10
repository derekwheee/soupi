import { Pantry, PantryItem } from '@prisma/client';
import prisma from '../../prisma';

export async function getPantries(userId: string): Promise<Pantry[]> {
    return prisma.pantry.findMany({
        where: { members: { some: { id: userId } } },
        include: {
            pantryItems: { include: { category: true } },
            itemCategories: true
        }
    });
}

export async function getAllPantryItems(pantryId: number): Promise<PantryItem[]> {
    return prisma.pantryItem.findMany({
        where: { pantryId },
        include: { category: true }
    });
};

export async function getPantryItem(pantryId: number, itemId: number): Promise<PantryItem> {
    return prisma.pantryItem.findUniqueOrThrow({
        where: { id: itemId, pantryId },
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

    return prisma.pantryItem.create({
        data: {
            ...data
        }
    });
}

export async function getPantryCategories(pantryId: number) {
    return prisma.itemCategory.findMany({
        where: { pantryId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: {
            pantryItems: {
                include: {
                    category: true
                }
            }
        }
    });
}