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
        },
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.ts'],
    },
});
