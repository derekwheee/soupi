import { vi } from 'vitest';

import { prismaMock } from '../../mocks/prisma';
import '../../mocks/broadcast';

vi.mock('../../../prisma', () => ({ default: prismaMock }));
vi.mock('../../../utils/sse');

const { joinHousehold } = await import('../../../src/services/household');

const mockHousehold = {
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    id: 1,
    joinToken: 'token-abc',
    name: 'My Household',
    updatedAt: new Date('2024-01-01'),
};

describe('joinHousehold()', () => {
    it('fetches household by id and joinToken then runs transaction', async () => {
        prismaMock.household.findUniqueOrThrow.mockResolvedValue(mockHousehold);
        prismaMock.$transaction.mockResolvedValue([null, mockHousehold] as never);

        const result = await joinHousehold('user_1', 1, 'token-abc');

        expect(prismaMock.household.findUniqueOrThrow).toHaveBeenCalledWith({
            where: { id: 1, joinToken: 'token-abc' },
        });
        expect(prismaMock.$transaction).toHaveBeenCalledOnce();
        expect(result).toEqual(mockHousehold);
    });

    it('throws when household is not found', async () => {
        prismaMock.household.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

        await expect(joinHousehold('user_1', 99, 'bad-token')).rejects.toThrow('Not found');
    });
});
