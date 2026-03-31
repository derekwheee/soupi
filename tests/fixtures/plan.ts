import type { Plan, PlanDay } from '@prisma/client';
import { mockRecipe } from './recipe';

export const mockPlanDay: PlanDay & { recipes: typeof mockRecipe[] } = {
    id: 1,
    date: new Date('2024-06-01'),
    planId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    recipes: [mockRecipe],
};

export const mockPlan: Plan & { planDays: typeof mockPlanDay[] } = {
    id: 1,
    householdId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    planDays: [mockPlanDay],
};
