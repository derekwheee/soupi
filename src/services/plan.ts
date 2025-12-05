import { Plan } from '@prisma/client';
import prisma from '../../prisma';

export async function createPlan(householdId: number): Promise<Plan> {
    const plan = await prisma.plan.create({
        data: {
            household: { connect: { id: householdId } },
        },
    });

    await prisma.planDay.create({
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
}

export async function getPlan(householdId: number): Promise<Plan> {
    return prisma.plan.findFirstOrThrow({
        where: {
            householdId,
            deletedAt: null,
        },
        include: {
            planDays: {
                where: { deletedAt: null },
                include: {
                    recipes: {
                        include: {
                            ingredients: true,
                        },
                    },
                },
            },
        },
    });
}

export async function addPlanDay(
    householdId: number,
    {
        planId,
        date,
    }: {
        planId: number;
        date: Date;
    },
): Promise<Plan> {
    return prisma.plan.update({
        where: { id: planId, householdId },
        data: {
            planDays: {
                create: {
                    date,
                },
            },
        },
        include: {
            planDays: {
                where: { deletedAt: null },
                include: { recipes: true },
            },
        },
    });
}

export async function removePlanDay(planDayId: number): Promise<void> {
    await prisma.planDay.update({
        where: { id: planDayId },
        data: {
            deletedAt: new Date(),
        },
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
        where: { id: planDayId },
        data: {
            recipes: {
                connect: recipeIds.map((id) => ({ id })),
            },
        },
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
        where: { id: planDayId },
        data: {
            recipes: {
                disconnect: { id: recipeId },
            },
        },
    });
}
