/**
 * One-off backfill: replace every household's old UUID joinToken with a
 * friendly FERN-2931 style code. Idempotent-ish — re-running just regenerates
 * codes, so run it once after deploying the new join-code generator.
 *
 *   DATABASE_URL=... npx ts-node scripts/backfill-join-codes.ts
 *
 * NOTE: old UUID links/QRs stop working once a household is backfilled.
 */
import prisma from '../prisma';
import { generateJoinCode } from '../utils/joinCode';

async function main() {
    const households = await prisma.household.findMany({
        select: { id: true, joinToken: true, name: true },
    });

    // Codes we've assigned in this run (not yet necessarily visible to a fresh
    // findUnique if the same code is drawn twice before its update commits).
    const assigned = new Set<string>();
    let updated = 0;

    for (const household of households) {
        // Skip ones already migrated (don't churn codes if re-run).
        if (/^[A-Z]+-\d{4}$/.test(household.joinToken)) {
            assigned.add(household.joinToken);
            continue;
        }
        const code = await uniqueCode(assigned);
        assigned.add(code);
        await prisma.household.update({
            data: { joinToken: code },
            where: { id: household.id },
        });
        updated += 1;
        console.log(`#${household.id} "${household.name}" → ${code}`);
    }

    console.log(`\nBackfilled ${updated} of ${households.length} household(s).`);
}

async function uniqueCode(taken: Set<string>): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const code = generateJoinCode();
        if (taken.has(code)) continue;
        const clash = await prisma.household.findUnique({ where: { joinToken: code } });
        if (!clash) return code;
    }
    throw new Error('Could not generate a unique join code after 20 attempts');
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
