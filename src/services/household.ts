import { Prisma } from '@prisma/client';
import prisma from '../../prisma';

export async function joinHousehold(
    userId: string,
    householdId: number,
    joinToken: string
): Promise<Prisma.HouseholdGetPayload<{ include?: any }>> {

    const household = await prisma.household.findUniqueOrThrow({
        where: { id: householdId, joinToken }
    });

    const [, joinedHousehold] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: {
                defaultHouseholdId: household.id
            }
        }),
        prisma.household.update({
            where: { id: household.id },
            data: {
                members: {
                    connect: { id: userId }
                }
            }
        })
    ]);

    return joinedHousehold;
}