import { User } from '@prisma/client';
import prisma from '../../prisma';
import { User as ClerkUser } from '@clerk/express';
import { DEFAULT_CATEGORIES, SSEMessageType } from '../../utils/constants';
import { broadcast } from '../../utils/sse';
import { createPlan } from './plan';

export async function getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
        where: { id },
        include: {
            households: true,
        },
    });
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
                where: { id },
                data: patch,
                include: {
                    households: true,
                },
            });
        },
    );
}

export async function createUser(user: ClerkUser): Promise<User> {
    return prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
            data: {
                id: user.id,
                clerkId: user.id,
                email: user.emailAddresses?.[0]?.emailAddress || '',
                name: user.fullName || '',
                households: {
                    create: {
                        name: 'My Household',
                        pantries: {
                            create: {
                                name: 'My Pantry',
                                isDefault: true,
                                itemCategories: {
                                    create: DEFAULT_CATEGORIES,
                                },
                            },
                        },
                    },
                },
            },
            include: { households: true },
        });

        const householdId = created.households?.[0]?.id;
        if (!householdId) return created;

        await createPlan(householdId);

        const updated = await tx.user.update({
            where: { id: created.id },
            data: { defaultHouseholdId: householdId },
            include: {
                households: true,
            },
        });

        return updated;
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
                where: { id: existing.id },
                data: {
                    clerkId: user.id,
                    email: user.emailAddresses[0]?.emailAddress || '',
                    name: user.fullName || '',
                },
                include: { households: true },
            });
        },
    );
}
