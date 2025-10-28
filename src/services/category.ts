import { ItemCategory } from '@prisma/client';
import prisma from '../../prisma';
import { broadcast } from '../../utils/sse';
import { SSEMessageType } from '../../utils/constants';

export async function getCategories(pantryId: number): Promise<ItemCategory[]> {
    return prisma.itemCategory.findMany({
        where: { pantryId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
    });
}

export async function getCategory(
    pantryId: number,
    categoryId: number,
): Promise<ItemCategory> {
    return prisma.itemCategory.findFirstOrThrow({
        where: { pantryId, id: categoryId },
    });
}

export async function upsertCategory(
    householdId: number,
    pantryId: number,
    item: ItemCategory,
): Promise<ItemCategory> {
    return await broadcast<ItemCategory>(
        householdId,
        SSEMessageType.CATEGORY_UPDATE,
        'upsertCategory',
        async () => {
            console.log('upsertCategory called', householdId, pantryId, item);
            // Validate household access to pantryId
            const pantry = await prisma.pantry.findUniqueOrThrow({
                where: { id: pantryId, householdId },
            });

            if (!pantry) {
                throw new Error('Pantry not found or access denied');
            }

            const { id, ...data } = item;

            console.log('upsertCategory existing check', id, item.name);

            const existing = await prisma.itemCategory.findFirst({
                where: {
                    pantryId,
                    OR: [id ? { id } : {}, { name: item.name }],
                },
            });

            if (existing) {
                return prisma.itemCategory.update({
                    where: { id: existing.id },
                    data,
                });
            }

            return prisma.itemCategory.create({
                data: {
                    ...data,
                },
            });
        },
    );
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
                where: { id: pantryId, householdId },
            });

            if (!pantry) {
                throw new Error('Pantry not found or access denied');
            }

            for (let index = 0; index < categoryIdsInOrder.length; ++index) {
                const categoryId = categoryIdsInOrder[index];
                await prisma.itemCategory.updateMany({
                    where: { id: categoryId, pantryId },
                    data: { sortOrder: index },
                });
            }
        },
    );
}
