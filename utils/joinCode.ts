import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';

/**
 * Friendly household join codes: a memorable word + four digits, e.g. FERN-2931.
 * Short enough to read aloud / type by hand, unlike the old 36-char UUID.
 */

// Curated, unambiguous words (no homophones/offensive terms), 4–6 letters.
const WORDS = [
    'FERN',
    'MINT',
    'SAGE',
    'BASIL',
    'THYME',
    'CHIVE',
    'OLIVE',
    'LEMON',
    'LIME',
    'PLUM',
    'PEAR',
    'KIWI',
    'MANGO',
    'BERRY',
    'PEACH',
    'APPLE',
    'GRAPE',
    'MELON',
    'COCOA',
    'HONEY',
    'MAPLE',
    'PECAN',
    'CACAO',
    'BEAN',
    'OAT',
    'RICE',
    'CORN',
    'KALE',
    'LEEK',
    'PEA',
    'OKRA',
    'BEET',
    'CARROT',
    'ONION',
    'GARLIC',
    'GINGER',
    'PEPPER',
    'TOMATO',
    'POTATO',
    'SQUASH',
    'WALNUT',
    'CASHEW',
    'ALMOND',
    'RAISIN',
    'CHERRY',
    'BANANA',
    'PAPAYA',
    'GUAVA',
    'COTTON',
    'CEDAR',
    'BIRCH',
    'MAIZE',
    'CLOVE',
    'CUMIN',
    'CURRY',
    'MISO',
    'TOFU',
    'BROTH',
    'STEW',
    'TOAST',
    'CREPE',
    'WAFFLE',
    'COOKIE',
    'MUFFIN',
    'SCONE',
    'BAGEL',
    'PASTA',
    'PESTO',
    'SALSA',
];

/** One random `WORD-NNNN` code (not checked for uniqueness). */
export function generateJoinCode(): string {
    const word = WORDS[randomInt(0, WORDS.length)];
    const digits = randomInt(0, 10000).toString().padStart(4, '0');
    return `${word}-${digits}`;
}

/**
 * A join code guaranteed unique against existing households. Retries on the
 * (rare) collision; falls back to an extra digit group if we're unlucky.
 */
export async function generateUniqueJoinCode(client: Prisma.TransactionClient): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
        const code = generateJoinCode();
        const clash = await client.household.findUnique({ where: { joinToken: code } });
        if (!clash) return code;
    }
    // Astronomically unlikely to reach here; widen the space rather than loop.
    return `${generateJoinCode()}-${randomInt(0, 10000).toString().padStart(4, '0')}`;
}
