import './env'; // Validate environment variables at startup — throws if any are missing
import prisma from '../prisma';
import logger from '../utils/logger';
import app from './app';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
});

// Graceful shutdown: stop accepting connections, disconnect Prisma, then exit.
// Docker/systemd send SIGTERM on stop/redeploy; without this, in-flight requests
// and SSE streams are dropped abruptly.
async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down…`);

    server.close(async () => {
        await prisma.$disconnect();
        logger.info('Closed HTTP server and database connections');
        process.exit(0);
    });

    // Don't hang forever if connections won't drain.
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
