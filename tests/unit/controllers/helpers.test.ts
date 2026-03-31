import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { parseBody } from '../../../src/controllers/helpers';

function mockRes() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return { status, json, _json: json, _status: status };
}

const SimpleSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
});

describe('parseBody()', () => {
    it('returns parsed data when body is valid', () => {
        const res = mockRes() as any;
        const result = parseBody(res, SimpleSchema, { name: 'Alice', age: 30 });
        expect(result).toEqual({ name: 'Alice', age: 30 });
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns null and sends 400 when body is invalid', () => {
        const res = mockRes() as any;
        const result = parseBody(res, SimpleSchema, { name: '' });
        expect(result).toBeNull();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.status().json).toHaveBeenCalledWith(
            expect.objectContaining({ error: 'Invalid request body', details: expect.any(Object) }),
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
        parseBody(res, SimpleSchema, { name: 'Alice', age: -5 });
        const call = res.status().json.mock.calls[0][0];
        expect(call.details).toHaveProperty('fieldErrors');
    });
});
