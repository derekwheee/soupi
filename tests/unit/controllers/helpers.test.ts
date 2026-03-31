import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { prismaMock } from '../../mocks/prisma';

vi.mock('../../../prisma', () => ({ default: prismaMock }));

import { parseBody } from '../../../src/controllers/helpers';

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
