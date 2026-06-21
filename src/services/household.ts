import { Prisma } from '@prisma/client';

import prisma from '../../prisma';

export async function joinHousehold(
    userId: string,
    householdId: number,
    joinToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Prisma.HouseholdGetPayload<{ include?: any }>> {
    // Join codes are stored uppercase (e.g. FERN-2931); normalize so a
    // hand-typed lowercase code or stray whitespace still matches.
    const household = await prisma.household.findUniqueOrThrow({
        where: { id: householdId, joinToken: joinToken.trim().toUpperCase() },
    });

    const [, joinedHousehold] = await prisma.$transaction([
        prisma.user.update({
            data: {
                defaultHouseholdId: household.id,
            },
            where: { id: userId },
        }),
        prisma.household.update({
            data: {
                members: {
                    connect: { id: userId },
                },
            },
            where: { id: household.id },
        }),
    ]);

    return joinedHousehold;
}
