// Set required env vars before any module is imported.
// Prisma validates DATABASE_URL at import time even when mocked,
// so a dummy value is needed in test environments without a real DB.
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost/test';
process.env.NLP_PARSER_PATH = process.env.NLP_PARSER_PATH ?? '/dev/null';
process.env.NLP_PYTHON_PATH = process.env.NLP_PYTHON_PATH ?? '/usr/bin/python3';
