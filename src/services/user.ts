import { User as ClerkUser } from '@clerk/express';
import { User } from '@prisma/client';

import prisma from '../../prisma';
import { DEFAULT_CATEGORIES, SSEMessageType } from '../../utils/constants';
import { broadcast } from '../../utils/sse';

export async function createUser(user: ClerkUser): Promise<User> {
    return prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
            data: {
                clerkId: user.id,
                email: user.emailAddresses?.[0]?.emailAddress || '',
                households: {
                    create: {
                        name: 'My Household',
                        pantries: {
                            create: {
                                isDefault: true,
                                itemCategories: {
                                    create: DEFAULT_CATEGORIES,
                                },
                                name: 'My Pantry',
                            },
                        },
                        plans: {
                            create: {
                                planDays: {
                                    create: {
                                        date: null,
                                    }
                                }
                            }
                        }
                    },
                },
                id: user.id,
                name: user.fullName || '',
            },
            include: { households: true },
        });

        const householdId = created.households?.[0]?.id;
        if (!householdId) return created;

        const updated = await tx.user.update({
            data: { defaultHouseholdId: householdId },
            include: {
                households: true,
            },
            where: { id: created.id },
        });

        return updated;
    });
}

export async function getById(id: string): Promise<null | User> {
    return prisma.user.findUnique({
        include: {
            households: true,
        },
        where: { id },
    });
}

export async function sync(user: ClerkUser): Promise<User> {
    const existing = await prisma.user.findUnique({
        where: { clerkId: user.id },
    });

    if (!existing) {
        return await createUser(user);
    }

    return await broadcast(
        existing.defaultHouseholdId!,
        SSEMessageType.USER_UPDATE,
        'syncUser',
        async () => {
            return await prisma.user.update({
                data: {
                    clerkId: user.id,
                    email: user.emailAddresses[0]?.emailAddress || '',
                    name: user.fullName || '',
                },
                include: { households: true },
                where: { id: existing.id },
            });
        },
    );
}

export async function updateUser(
    id: string,
    patch: Partial<User>,
): Promise<User> {
    return await broadcast(
        (await getById(id))!.defaultHouseholdId!,
        SSEMessageType.USER_UPDATE,
        'updateUser',
        async () => {
            if ('defaultHouseholdId' in patch) {
                throw new Error(
                    'Use `householdService.joinHousehold` to update defaultHouseholdId',
                );
            }

            if ('clerkId' in patch || 'email' in patch || 'name' in patch) {
                throw new Error(
                    'Use `userService.sync` to update clerk parameters',
                );
            }

            return prisma.user.update({
                data: patch,
                include: {
                    households: true,
                },
                where: { id },
            });
        },
    );
}
