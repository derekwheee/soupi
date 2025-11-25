import { Request, Response } from 'express';
import * as planService from '../services/plan';
import { householdController } from './helpers';
import { Household } from '@prisma/client';

export async function getPlan(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        planService.getPlan(household.id),
    );
}

export async function addPlanDay(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        planService.addPlanDay(household.id, req.body),
    );
}

export async function removePlanDay(req: Request, res: Response) {
    const { planDayId } = req.params;
    return await householdController(req, res, () =>
        planService.removePlanDay(Number(planDayId)),
    );
}

export async function addRecipeToPlanDay(req: Request, res: Response) {
    return await householdController(req, res, () =>
        planService.addRecipeToPlanDay(req.body),
    );
}

export async function removeRecipeFromPlanDay(req: Request, res: Response) {
    const { planDayId, recipeId } = req.params;
    return await householdController(req, res, () =>
        planService.removeRecipeFromPlanDay({
            planDayId: Number(planDayId),
            recipeId: Number(recipeId),
        }),
    );
}
