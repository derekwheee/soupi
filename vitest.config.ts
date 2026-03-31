import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts', 'utils/**/*.ts'],
            exclude: ['src/server.ts', 'src/app.ts'],
            reporter: ['text', 'lcov'],
        },
    },
    resolve: {
        alias: {
            // Match TypeScript path for prisma client
        },
    },
});
