import { ItemCategory } from '@prisma/client';
import prisma from '../../prisma';

export async function getItemCategories(): Promise<ItemCategory[]> {
    return prisma.itemCategory.findMany({
        where: { deletedAt: null },
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

export async function upsertItemCategory(category: ItemCategory): Promise<ItemCategory> {
    return prisma.itemCategory.upsert({
        where: { id: category.id || 0 },
        update: category,
        create: category
    });
}