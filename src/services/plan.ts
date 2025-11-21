import { Plan } from '@prisma/client';
import prisma from '../../prisma';

export async function getPlan(
    householdId: number,
): Promise<Plan[]> {
    return prisma.plan.findMany({
        where: {
            householdId,
            deletedAt: null,
        },
        include: {
            planDays: {
                where: { deletedAt: null },
            },
        },
    });
}
