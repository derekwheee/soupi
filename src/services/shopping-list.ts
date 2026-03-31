import { ItemCategory } from '@prisma/client';

import prisma from '../../prisma';

export async function getListByCategory(pantryId: number): Promise<ItemCategory[]> {
    return prisma.itemCategory.findMany({
        include: {
            pantryItems: {
                where: { deletedAt: null },
            },
        },
        orderBy: { sortOrder: 'asc' },
        where: {
            deletedAt: null,
            pantryId,
            pantryItems: {
                some: {
                    deletedAt: null,
                },
            },
        },
    });
}
