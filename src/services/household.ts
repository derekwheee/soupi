import { Prisma } from '@prisma/client';

import prisma from '../../prisma';

export async function joinHousehold(
    userId: string,
    householdId: number,
    joinToken: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Prisma.HouseholdGetPayload<{ include?: any }>> {

    const household = await prisma.household.findUniqueOrThrow({
        where: { id: householdId, joinToken }
    });

    const [, joinedHousehold] = await prisma.$transaction([
        prisma.user.update({
            data: {
                defaultHouseholdId: household.id
            },
            where: { id: userId }
        }),
        prisma.household.update({
            data: {
                members: {
                    connect: { id: userId }
                }
            },
            where: { id: household.id }
        })
    ]);

    return joinedHousehold;
}