# Copilot Instructions — Soupi

Soupi is a household recipe and pantry management app. It is a Node.js/TypeScript REST API built with Express, backed by PostgreSQL via Prisma, with Clerk for authentication, OpenAI for AI features, and Puppeteer for recipe scraping.

## Tech Stack

- **Runtime**: Node.js 22, TypeScript (strict, module: nodenext)
- **Framework**: Express 5
- **Auth**: Clerk (`@clerk/express`) — `clerkMiddleware()` in app.ts, `requireAuth()` on all routes
- **Database**: PostgreSQL via Prisma 6 with Prisma Accelerate extension
- **Validation**: Zod 4 — all schemas in `src/schemas/index.ts`
- **Logging**: pino + pino-http (JSON in prod, pretty in dev) — singleton at `utils/logger.ts`
- **Rate limiting**: `express-rate-limit` — strict on `/ai/*`, general on all routes
- **Real-time**: Server-Sent Events via `utils/sse.ts`
- **Testing**: Vitest + vitest-mock-extended + @vitest/coverage-v8
- **Linting**: ESLint 9 flat config with `typescript-eslint` + `eslint-plugin-perfectionist`

## Project Structure

```
src/
  app.ts              # Express app setup — middleware, routes, rate limiters
  server.ts           # Entry point
  controllers/
    helpers.ts        # HOF wrappers: controller(), householdController(), parseBody()
    *.ts              # One file per domain (recipe, pantry, category, plan, …)
  routes/
    *.ts              # Express routers — one file per domain
  services/
    *.ts              # Business logic — one file per domain
  schemas/
    index.ts          # All Zod schemas (centralised here, nowhere else)
  middleware/
    require-auth.ts   # requireAuth() middleware

prisma/
  index.ts            # PrismaClient singleton with Accelerate extension
  schema/             # Split schema files
  seed.ts

utils/
  logger.ts           # Pino logger singleton
  sse.ts              # broadcast(), addClient(), clientsByHousehold
  constants.ts        # SSEMessageType enum, DEFAULT_CATEGORIES, etc.

tests/
  mocks/
    prisma.ts         # Deep Prisma mock (vitest-mock-extended)
    broadcast.ts      # No-op SSE broadcast mock
  fixtures/
    *.ts              # Typed sample objects per domain
  unit/
    schemas.test.ts
    controllers/helpers.test.ts
    services/*.test.ts
```

## Request Handling Pattern

All route handlers go through one of two HOFs defined in `src/controllers/helpers.ts`:

### `controller(req, res, fn)`

Generic wrapper. Extracts `userId` from Clerk auth, calls `fn(userId)`, encodes HTML entities in the response, and handles errors with `logger.error` + 500.

### `householdController(req, res, fn, { skipAccessCheck? })`

Household-scoped wrapper. Validates `:householdId` param (400), checks Clerk auth (401), verifies the user is a member of the household via Prisma (403), then delegates to `controller()` passing the `Household` object.

```ts
// Controller example
export async function getRecipe(req: Request, res: Response) {
    return await householdController(req, res, async (household: Household) => {
        return recipeService.getRecipe(household.id, Number(req.params.id));
    });
}
```

### `parseBody<T>(res, schema, body)`

Validates the request body against a Zod schema. Returns typed data or sends a 400 with Zod error details and returns `null`. **Always check for null before continuing.**

```ts
const body = parseBody(res, UpsertRecipeSchema, req.body);
if (!body) return;
return recipeService.upsertRecipe(household.id, body);
```

### Route registration

Apply `requireAuth()` to every route. Use `householdController` for routes under `/:householdId/`.

```ts
const prefix = '/household/:householdId/recipes';
router.get(prefix, requireAuth(), getAllRecipes);
router.post(prefix, requireAuth(), upsertRecipe);
```

## Validation Pattern

All Zod schemas live in **`src/schemas/index.ts`** — never inline schemas in controllers or services.

Common conventions:

- Optional nullable fields: `.nullable().optional()`
- Date strings from client: `z.coerce.date()`
- IDs: `z.number().int().positive()`
- Names: `z.string().min(1)`

## Service Layer Pattern

- Plain async functions, no classes
- Import Prisma: `import prisma from '../../prisma'`
- Import logger: `import logger from '../../utils/logger'`
- Wrap mutating operations in `broadcast()` for real-time SSE updates
- Use `prisma.$transaction()` for any multi-step write

```ts
export async function upsertRecipe(householdId: number, data: UpsertRecipeInput) {
    return broadcast(householdId, SSEMessageType.RECIPE_UPDATE, 'recipe', async () => {
        return prisma.recipe.upsert({ ... });
    });
}
```

## Database Conventions

- **Soft deletes**: filter `where: { deletedAt: null }` on all reads
- **Transactions**: use `prisma.$transaction(async (tx) => { ... })` for multi-step writes
- **Pagination**: `getAllRecipes` and similar list endpoints accept `?page=&limit=` query params; use `skip`/`take`

## Logging

Use the shared pino logger — never use `console.*`.

```ts
import logger from '../../utils/logger';

logger.info({ householdId }, 'Fetching recipes');
logger.error({ err: error }, 'Failed to parse ingredients');
```

## Testing Patterns

- **Framework**: Vitest with `globals: true` — no need to import `describe`/`it`/`expect`
- **Prisma mock**: import `prismaMock` from `tests/mocks/prisma` — it auto-resets between tests
- **Broadcast mock**: import `tests/mocks/broadcast` as a side effect — makes `broadcast()` a pass-through
- **Service imports**: use `await import()` _after_ `vi.mock()` declarations so mocks are active

```ts
vi.mock('../../prisma', () => ({ default: prismaMock }));
vi.mock('../../../utils/sse');

// Import service after mocks are declared
const { getRecipe } = await import('../../../src/services/recipe');
```

- **Fixtures**: use typed objects from `tests/fixtures/` rather than inline objects
- **Mock return values**: `prismaMock.recipe.findFirst.mockResolvedValue(mockRecipe as any)`
- **Transaction mock**:
    - Callback form: `prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock))`
    - Array form: `prismaMock.$transaction.mockResolvedValue([])`

## ESLint Rules

The project enforces `eslint-plugin-perfectionist`. This means:

- **Imports must be sorted** alphabetically (external before internal, grouped by source)
- **Object keys must be sorted** alphabetically
- **Interface/type fields must be sorted** alphabetically

Run `npx eslint --fix <file>` to auto-fix sort order violations. Use `// eslint-disable-next-line` only for intentional exceptions (e.g., `any` in HOF signatures, recursive JSON decoders).

## Auth Checklist

When adding a new route:

1. Add `requireAuth()` middleware
2. Use `householdController()` if the route is household-scoped
3. Add a Zod schema to `src/schemas/index.ts` for any request body
4. Validate with `parseBody()` before passing to the service

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — PostgreSQL connection string (Prisma Accelerate)
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`
- `NLP_PYTHON_PATH` / `NLP_PARSER_PATH` — Python NLP subprocess
- `LOG_LEVEL` — pino log level (default: `info`)

All required env vars are validated at startup in `src/env.ts` via Zod — the server throws immediately with a clear error message if any are missing or malformed.

## Scripts Reference

| Script                  | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Development server with auto-reload                   |
| `npm run build`         | TypeScript compile                                    |
| `npm run lint`          | ESLint check                                          |
| `npm run format`        | Prettier format (write)                               |
| `npm run format:check`  | Prettier format (CI check)                            |
| `npm test`              | Run Vitest once                                       |
| `npm run test:watch`    | Vitest in watch mode                                  |
| `npm run test:ui`       | Vitest visual UI browser                              |
| `npm run test:coverage` | Run tests with coverage report                        |
| `npm run studio`        | Open Prisma Studio                                    |
| `npm run migrate`       | Run pending migrations (`prisma migrate deploy`)      |
| `npm run db:reset`      | Reset local database (`prisma migrate reset --force`) |

## Code Style

- **Prettier**: single quotes, 4-space indent, trailing commas, 100-char print width
- **ESLint**: typescript-eslint + perfectionist (sorted imports, object keys, interface fields)
- A pre-commit hook (husky + lint-staged) runs `prettier --write` and `eslint --fix` on staged files automatically
