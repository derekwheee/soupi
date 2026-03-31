import { ItemCategory } from '@prisma/client';

import prisma from '../../prisma';
import { SSEMessageType } from '../../utils/constants';
import { broadcast } from '../../utils/sse';

type ItemCategoryInput = Partial<Omit<ItemCategory, 'createdAt' | 'deletedAt' | 'pantryId' | 'updatedAt'>> & {
    name: string;
};

export async function getCategories(pantryId: number): Promise<ItemCategory[]> {
    return prisma.itemCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        where: { deletedAt: null, pantryId },
    });
}

export async function getCategory(
    pantryId: number,
    categoryId: number,
): Promise<ItemCategory> {
    return prisma.itemCategory.findFirstOrThrow({
        where: { id: categoryId, pantryId },
    });
}

export async function updateSortOrder(
    householdId: number,
    pantryId: number,
    categoryIdsInOrder: number[],
): Promise<void> {
    await broadcast<void>(
        householdId,
        SSEMessageType.CATEGORY_UPDATE,
        'updateSortOrder',
        async () => {
            // Validate household access to pantryId
            const pantry = await prisma.pantry.findUniqueOrThrow({
                where: { householdId, id: pantryId },
            });

            if (!pantry) {
                throw new Error('Pantry not found or access denied');
            }

            await prisma.$transaction(
                categoryIdsInOrder.map((categoryId, index) =>
                    prisma.itemCategory.updateMany({
                        data: { sortOrder: index },
                        where: { id: categoryId, pantryId },
                    }),
                ),
            );
        },
    );
}

export async function upsertCategory(
    householdId: number,
    pantryId: number,
    item: ItemCategoryInput,
): Promise<ItemCategory> {
    return await broadcast<ItemCategory>(
        householdId,
        SSEMessageType.CATEGORY_UPDATE,
        'upsertCategory',
        async () => {
            // Validate household access to pantryId
            const pantry = await prisma.pantry.findUniqueOrThrow({
                where: { householdId, id: pantryId },
            });

            if (!pantry) {
                throw new Error('Pantry not found or access denied');
            }

            const { id, ...data } = item;

            const existing = await prisma.itemCategory.findFirst({
                where: {
                    OR: [id ? { id } : {}, { name: item.name }],
                    pantryId,
                },
            });

            if (existing) {
                return prisma.itemCategory.update({
                    data,
                    where: { id: existing.id },
                });
            }

            return prisma.itemCategory.create({
                data: {
                    ...data,
                    pantryId,
                },
            });
        },
    );
}
