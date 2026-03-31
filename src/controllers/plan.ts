import { Household } from '@prisma/client';
import { Request, Response } from 'express';

import { AddPlanDaySchema, AddRecipesToPlanDaySchema } from '../schemas';
import * as planService from '../services/plan';
import { householdController, parseBody } from './helpers';

export async function addPlanDay(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) => {
        const body = parseBody(res, AddPlanDaySchema, req.body);
        if (!body) return;
        return planService.addPlanDay(household.id, body);
    });
}

export async function addRecipesToPlanDay(req: Request, res: Response) {
    return await householdController(req, res, () => {
        const body = parseBody(res, AddRecipesToPlanDaySchema, req.body);
        if (!body) return;
        return planService.addRecipesToPlanDay({
            planDayId: Number(req.params.planDayId),
            recipeIds: body,
        });
    });
}

export async function getPlan(req: Request, res: Response) {
    return await householdController(req, res, (household: Household) =>
        planService.getPlan(household.id),
    );
}

export async function removePlanDay(req: Request, res: Response) {
    const { planDayId } = req.params;
    return await householdController(req, res, () => planService.removePlanDay(Number(planDayId)));
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
