import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            // Match TypeScript path for prisma client
        },
    },
    test: {
        coverage: {
            exclude: ['src/server.ts', 'src/app.ts'],
            include: ['src/**/*.ts', 'utils/**/*.ts'],
            provider: 'v8',
            reporter: ['text', 'lcov'],
            thresholds: {
                branches: 18,
                functions: 20,
                lines: 20,
                statements: 20,
            },
        },
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
    },
});
