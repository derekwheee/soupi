import { Pantry, PantryItem } from '@prisma/client';

import prisma from '../../prisma';
import { SSEMessageType } from '../../utils/constants';
import { broadcast } from '../../utils/sse';

type PantryItemInput = Partial<Omit<PantryItem, 'createdAt' | 'deletedAt' | 'updatedAt'>> & {
    name: string;
    pantryId: number;
};

export async function getAllPantryItems(
    householdId: number,
    pantryId: number,
): Promise<PantryItem[]> {
    return prisma.pantryItem.findMany({
        include: { category: true },
        where: { deletedAt: null, pantry: { householdId }, pantryId },
    });
}

export async function getPantries(householdId: number): Promise<Pantry> {
    // TODO: Get user's default pantry
    return prisma.pantry.findFirstOrThrow({
        include: {
            itemCategories: { orderBy: { sortOrder: 'asc' } },
            pantryItems: {
                include: { category: true },
                orderBy: { id: 'asc' },
                where: { deletedAt: null },
            },
        },
        where: { householdId },
    });
}

export async function getPantryItem(
    householdId: number,
    pantryId: number,
    itemId: number,
): Promise<PantryItem> {
    return prisma.pantryItem.findUniqueOrThrow({
        include: { category: true },
        where: { id: itemId, pantry: { householdId }, pantryId },
    });
}

export async function upsertPantryItem(
    householdId: number,
    item: PantryItemInput,
): Promise<PantryItem> {
    return await broadcast<PantryItem>(
        householdId,
        SSEMessageType.PANTRY_UPDATE,
        'upsertPantryItem',
        async () => {
            // Validate household access to pantryId
            const pantry = await prisma.pantry.findUniqueOrThrow({
                where: { householdId, id: item.pantryId },
            });

            if (!pantry) {
                throw new Error('Pantry not found or access denied');
            }

            const { id, ...data } = item;

            const existing = await prisma.pantryItem.findFirst({
                where: {
                    OR: [id ? { id } : {}, { name: item.name }],
                },
            });

            if (existing) {
                return prisma.pantryItem.update({
                    data,
                    where: { id: existing.id },
                });
            }

            const newItem = prisma.pantryItem.create({
                data: {
                    ...data,
                },
                include: { category: true },
            });

            return newItem;
        },
    );
}
