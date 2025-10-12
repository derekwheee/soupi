import { User } from '@prisma/client';
import prisma from '../../prisma';
import { User as ClerkUser } from '@clerk/express';

export async function getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
        where: { id },
        include: {
            households: { where: { isDefault: true } }
        }
    });
}

export async function sync(user: ClerkUser): Promise<User> {

    const existing = await prisma.user.findUnique({ where: { clerkId: user.id } });

    if (!existing) {
        const newUser = await prisma.user.create({
            data: {
                id: user.id,
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                name: user.fullName || '',
                households: { create: {
                    name: 'My Household',
                    isDefault: true,
                    pantries: { create: { name: 'My Pantry' } }
                } }
            }
        });

        return newUser;
    }

    return await prisma.user.update({
        where: { id: existing.id },
        data: {
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: user.fullName || ''
        }
    });
}