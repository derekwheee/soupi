import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { beforeEach, vi } from 'vitest';

// Create a deep mock of the Prisma client
export const prismaMock = mockDeep<PrismaClient>();

// Auto-reset between tests
beforeEach(() => {
    mockReset(prismaMock);
});

// Mock the prisma module so services get our mock
vi.mock('../../prisma/index', () => ({
    default: prismaMock,
}));

export type PrismaMock = DeepMockProxy<PrismaClient>;
