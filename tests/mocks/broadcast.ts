import { vi } from 'vitest';

// Replace broadcast with a passthrough that just runs the callback
export const broadcastMock = vi.fn(
    async <T>(
        _householdId: number,
        _type: unknown,
        _from: string,
        cb: () => Promise<T>,
    ): Promise<T> => cb(),
);

vi.mock('../../utils/sse', () => ({
    addClient: vi.fn(),
    broadcast: broadcastMock,
}));
