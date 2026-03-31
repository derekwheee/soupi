import { Plan } from '@prisma/client';

import prisma from '../../prisma';

export async function addPlanDay(
    householdId: number,
    {
        date,
        planId,
    }: {
        date: Date;
        planId: number;
    },
): Promise<Plan> {
    return prisma.plan.update({
        data: {
            planDays: {
                create: {
                    date,
                },
            },
        },
        include: {
            planDays: {
                include: { recipes: true },
                where: { deletedAt: null },
            },
        },
        where: { householdId, id: planId },
    });
}

export async function addRecipesToPlanDay({
    planDayId,
    recipeIds,
}: {
    planDayId: number;
    recipeIds: number[];
}): Promise<void> {
    await prisma.planDay.update({
        data: {
            recipes: {
                connect: recipeIds.map((id) => ({ id })),
            },
        },
        where: { id: planDayId },
    });
}

export async function createPlan(householdId: number): Promise<Plan> {
    return prisma.$transaction(async (tx) => {
        const plan = await tx.plan.create({
            data: {
                household: { connect: { id: householdId } },
            },
        });

        await tx.planDay.create({
            data: {
                // Create a plan day with an explicit null date
                // This is the "upcoming" plan day
                date: null,
                plan: {
                    connect: { id: plan.id },
                },
            },
        });

        return plan;
    });
}

export async function getPlan(householdId: number): Promise<Plan> {
    return prisma.plan.findFirstOrThrow({
        include: {
            planDays: {
                include: {
                    recipes: {
                        include: {
                            ingredients: true,
                        },
                    },
                },
                where: { deletedAt: null },
            },
        },
        where: {
            deletedAt: null,
            householdId,
        },
    });
}

export async function removePlanDay(planDayId: number): Promise<void> {
    await prisma.planDay.update({
        data: {
            deletedAt: new Date(),
        },
        where: { id: planDayId },
    });
}

export async function removeRecipeFromPlanDay({
    planDayId,
    recipeId,
}: {
    planDayId: number;
    recipeId: number;
}): Promise<void> {
    await prisma.planDay.update({
        data: {
            recipes: {
                disconnect: { id: recipeId },
            },
        },
        where: { id: planDayId },
    });
}
