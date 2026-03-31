import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../mocks/prisma';
import { mockRecipe, mockIngredient } from '../../fixtures/recipe';

vi.mock('../../../prisma/index', () => ({ default: prismaMock }));
vi.mock('../../../utils/logger', () => ({ default: { error: vi.fn(), info: vi.fn() } }));

// We'll mock spawnSync at the module level and update its return value per test
const spawnSyncMock = vi.fn();
vi.mock('node:child_process', () => ({ spawnSync: spawnSyncMock }));

const { parseIngredients } = await import('../../../src/services/ingredient');

// Set required env vars
beforeEach(() => {
    spawnSyncMock.mockClear();
    process.env.NLP_PYTHON_PATH = '/usr/bin/python3';
    process.env.NLP_PARSER_PATH = '/app/python/parser.py';
});

const validParsedOutput = JSON.stringify([
    {
        sentence: '2 cups flour',
        name: [{ text: 'flour' }],
        amount: [{ quantity: '2', unit: 'cups' }],
        size: null,
        preparation: null,
    },
]);

describe('parseIngredients() — error paths', () => {
    it('throws when NLP_PARSER_PATH is not set', async () => {
        delete process.env.NLP_PARSER_PATH;

        await expect(parseIngredients(mockRecipe)).rejects.toThrow(
            'NLP_PYTHON_PATH and NLP_PARSER_PATH are required',
        );
        expect(spawnSyncMock).not.toHaveBeenCalled();
    });

    it('throws when spawnSync returns an error', async () => {
        spawnSyncMock.mockReturnValue({ error: new Error('spawn ENOENT'), status: null, stdout: '', stderr: '' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow('NLP parser process error: spawn ENOENT');
    });

    it('throws when exit code is non-zero', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 1, stdout: '', stderr: 'SyntaxError: bad code' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow('NLP parser exited with code 1');
    });

    it('includes stderr in non-zero exit error message', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 2, stdout: '', stderr: 'ImportError: no module' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow('ImportError: no module');
    });

    it('throws when stdout is empty', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 0, stdout: '', stderr: '' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow('NLP parser produced no output');
    });

    it('throws when stdout is invalid JSON', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 0, stdout: 'not json {{{', stderr: '' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow('NLP parser returned invalid JSON');
    });

    it('throws when stdout is valid JSON but not an array', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 0, stdout: '{"result": true}', stderr: '' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow('NLP parser returned unexpected output format');
    });
});

describe('parseIngredients() — retry logic', () => {
    it('retries once when stdout starts with "Downloading"', async () => {
        spawnSyncMock
            .mockReturnValueOnce({ error: null, status: 0, stdout: 'Downloading model...', stderr: '' })
            .mockReturnValueOnce({ error: null, status: 0, stdout: validParsedOutput, stderr: '' });

        prismaMock.$transaction.mockResolvedValue([]);
        prismaMock.recipe.findUniqueOrThrow.mockResolvedValue(mockRecipe as any);

        await parseIngredients(mockRecipe);

        expect(spawnSyncMock).toHaveBeenCalledTimes(2);
    });

    it('throws on second "Downloading" without infinite loop', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 0, stdout: 'Downloading model...', stderr: '' });

        await expect(parseIngredients(mockRecipe)).rejects.toThrow(
            'NLP model is still downloading, please try again later',
        );
        expect(spawnSyncMock).toHaveBeenCalledTimes(2);
    });
});

describe('parseIngredients() — success path', () => {
    it('parses output and updates all ingredients in a transaction', async () => {
        spawnSyncMock.mockReturnValue({ error: null, status: 0, stdout: validParsedOutput, stderr: '' });
        prismaMock.ingredient.update.mockResolvedValue(mockIngredient);
        prismaMock.$transaction.mockResolvedValue([mockIngredient]);
        prismaMock.recipe.findUniqueOrThrow.mockResolvedValue(mockRecipe as any);

        const result = await parseIngredients(mockRecipe);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(prismaMock.recipe.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: mockRecipe.id } }),
        );
        expect(result).toEqual(mockRecipe);
    });

    it('fetches recipe from DB when called with a numeric id', async () => {
        prismaMock.recipe.findUniqueOrThrow
            .mockResolvedValueOnce(mockRecipe as any) // initial fetch by id
            .mockResolvedValueOnce(mockRecipe as any); // final fetch after updates
        spawnSyncMock.mockReturnValue({ error: null, status: 0, stdout: validParsedOutput, stderr: '' });
        prismaMock.$transaction.mockResolvedValue([]);

        await parseIngredients(1);

        // First call: fetch recipe by id
        expect(prismaMock.recipe.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 1 } }),
        );
    });
});
