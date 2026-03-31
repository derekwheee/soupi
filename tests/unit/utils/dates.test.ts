import { daysBetween } from '../../../utils/dates';

describe('daysBetween()', () => {
    it('returns 0 for the same day', () => {
        const d = new Date('2024-03-15');
        expect(daysBetween(d, d)).toBe(0);
    });

    it('returns positive when b is after a', () => {
        expect(daysBetween(new Date('2024-01-01'), new Date('2024-01-08'))).toBe(7);
    });

    it('returns negative when b is before a', () => {
        expect(daysBetween(new Date('2024-01-08'), new Date('2024-01-01'))).toBe(-7);
    });

    it('ignores time-of-day differences', () => {
        const a = new Date('2024-06-01T23:59:59');
        const b = new Date('2024-06-02T00:00:01');
        expect(daysBetween(a, b)).toBe(1);
    });

    it('handles leap year boundaries', () => {
        expect(daysBetween(new Date('2024-02-28'), new Date('2024-03-01'))).toBe(2);
        expect(daysBetween(new Date('2023-02-28'), new Date('2023-03-01'))).toBe(1);
    });

    it('handles year boundaries', () => {
        expect(daysBetween(new Date('2023-12-31'), new Date('2024-01-01'))).toBe(1);
    });
});
