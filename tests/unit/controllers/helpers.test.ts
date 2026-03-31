import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { prismaMock } from '../../mocks/prisma';

vi.mock('../../../prisma', () => ({ default: prismaMock }));
vi.mock('@clerk/express', () => ({
    getAuth: vi.fn().mockReturnValue({ userId: 'user_123' }),
}));
vi.mock('../../../utils/logger', () => ({
    default: { error: vi.fn(), info: vi.fn() },
}));

import { getAuth } from '@clerk/express';

import { controller, householdController, parseBody } from '../../../src/controllers/helpers';

function mockRes() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return { _json: json, _status: status, json, status };
}

const SimpleSchema = z.object({
    age: z.number().int().positive(),
    name: z.string().min(1),
});

describe('parseBody()', () => {
    it('returns parsed data when body is valid', () => {
        const res = mockRes() as any;
        const result = parseBody(res, SimpleSchema, { age: 30, name: 'Alice' });
        expect(result).toEqual({ age: 30, name: 'Alice' });
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns null and sends 400 when body is invalid', () => {
        const res = mockRes() as any;
        const result = parseBody(res, SimpleSchema, { name: '' });
        expect(result).toBeNull();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith(
            expect.objectContaining({ details: expect.any(Object), error: 'Invalid request body' }),
        );
    });

    it('returns null when body is completely wrong type', () => {
        const res = mockRes() as any;
        const result = parseBody(res, SimpleSchema, null);
        expect(result).toBeNull();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('includes Zod flatten details in 400 response', () => {
        const res = mockRes() as any;
        parseBody(res, SimpleSchema, { age: -5, name: 'Alice' });
        const call = res.status().json.mock.calls[0][0];
        expect(call.details).toHaveProperty('fieldErrors');
    });
});

function mockReqRes(params: Record<string, string> = {}) {
    const json = vi.fn();
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ json, send });
    const req = { params } as any;
    const res = { json, send, status } as any;
    return { req, res };
}

describe('controller()', () => {
    it('calls fn with userId and returns JSON', async () => {
        const { req, res } = mockReqRes();
        const fn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

        await controller(req, res, fn);

        expect(fn).toHaveBeenCalledWith('user_123');
        expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Test' });
    });

    it('sends plain text for non-object return values', async () => {
        const { req, res } = mockReqRes();
        const fn = vi.fn().mockResolvedValue('plain text');

        await controller(req, res, fn);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 with error message when fn throws an Error', async () => {
        const { req, res } = mockReqRes();
        const fn = vi.fn().mockRejectedValue(new Error('Something went wrong'));

        await controller(req, res, fn);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.status().json).toHaveBeenCalledWith({ error: 'Something went wrong' });
    });

    it('returns 500 with fallback message for non-Error throws', async () => {
        const { req, res } = mockReqRes();
        const fn = vi.fn().mockRejectedValue('raw string error');

        await controller(req, res, fn);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.status().json).toHaveBeenCalledWith({ error: 'An unknown error occurred' });
    });

    it('HTML-decodes entity strings in response', async () => {
        const { req, res } = mockReqRes();
        const fn = vi.fn().mockResolvedValue({ name: 'Caf&eacute;' });

        await controller(req, res, fn);

        expect(res.json).toHaveBeenCalledWith({ name: 'Café' });
    });
});

describe('householdController()', () => {
    it('returns 400 when householdId is not a number', async () => {
        const { req, res } = mockReqRes({ householdId: 'abc' });

        await householdController(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith({ error: 'Invalid householdId parameter' });
    });

    it('returns 401 when no userId in auth', async () => {
        vi.mocked(getAuth).mockReturnValueOnce({ userId: null } as any);
        const { req, res } = mockReqRes({ householdId: '1' });

        await householdController(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user does not have access to household', async () => {
        prismaMock.household.findFirst.mockResolvedValue(null);
        const { req, res } = mockReqRes({ householdId: '1' });

        await householdController(req, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls fn with household when access is granted', async () => {
        const mockHousehold = { id: 1, name: 'My Household' } as any;
        prismaMock.household.findFirst.mockResolvedValue(mockHousehold);
        const { req, res } = mockReqRes({ householdId: '1' });
        const fn = vi.fn().mockResolvedValue({ ok: true });

        await householdController(req, res, fn);

        expect(fn).toHaveBeenCalledWith(mockHousehold);
        expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
});
