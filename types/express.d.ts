import { Household } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            household: Household;
            userId: string;
        }
    }
}
