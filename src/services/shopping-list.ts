import { ItemCategory } from '@prisma/client';
import prisma from '../../prisma';

export async function getListByCategory(
    pantryId: number,
): Promise<ItemCategory[]> {
    return prisma.itemCategory.findMany({
        where: {
            pantryId,
            deletedAt: null,
            pantryItems: {
                some: {
                    deletedAt: null,
                },
            },
        },
        orderBy: { sortOrder: 'asc' },
        include: {
            pantryItems: {
                where: { deletedAt: null },
            },
        },
    });
}
