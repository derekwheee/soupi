import type { Plan, PlanDay } from '@prisma/client';

import { mockRecipe } from './recipe';

export const mockPlanDay: PlanDay & { recipes: typeof mockRecipe[] } = {
    createdAt: new Date('2024-01-01'),
    date: new Date('2024-06-01'),
    deletedAt: null,
    id: 1,
    planId: 1,
    recipes: [mockRecipe],
    updatedAt: new Date('2024-01-01'),
};

export const mockPlan: Plan & { planDays: typeof mockPlanDay[] } = {
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    householdId: 1,
    id: 1,
    planDays: [mockPlanDay],
    updatedAt: new Date('2024-01-01'),
};
