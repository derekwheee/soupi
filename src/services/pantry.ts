import { Pantry, PantryItem } from '@prisma/client';
import prisma from '../../prisma';
import { broadcast } from '../../utils/sse';
import { SSEMessageType } from '../../utils/constants';

export async function getPantries(householdId: number): Promise<Pantry> {
    // TODO: Get user's default pantry
    return prisma.pantry.findFirstOrThrow({
        where: { householdId },
        include: {
            pantryItems: {
                where: { deletedAt: null },
                orderBy: { id: 'asc' },
                include: { category: true },
            },
            itemCategories: { orderBy: { sortOrder: 'asc' } },
        },
    });
}

export async function getAllPantryItems(
    householdId: number,
    pantryId: number,
): Promise<PantryItem[]> {
    return prisma.pantryItem.findMany({
        where: { pantryId, pantry: { householdId }, deletedAt: null },
        include: { category: true },
    });
}

export async function getPantryItem(
    householdId: number,
    pantryId: number,
    itemId: number,
): Promise<PantryItem> {
    return prisma.pantryItem.findUniqueOrThrow({
        where: { id: itemId, pantryId, pantry: { householdId } },
        include: { category: true },
    });
}

export async function upsertPantryItem(
    householdId: number,
    item: PantryItem,
): Promise<PantryItem> {
    return await broadcast<PantryItem>(
        householdId,
        SSEMessageType.PANTRY_UPDATE,
        'upsertPantryItem',
        async () => {
            // Validate household access to pantryId
            const pantry = await prisma.pantry.findUniqueOrThrow({
                where: { id: item.pantryId, householdId },
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
                    where: { id: existing.id },
                    data,
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
