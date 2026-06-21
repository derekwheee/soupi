import { Router } from 'express';

import { addClient } from '../../utils/sse';
import requireAuth from '../middleware/require-auth';

const router = Router();

// Comment-only frame every 25s keeps the connection alive through the
// Cloudflare Tunnel / proxies, which otherwise close idle streams and force a
// reconnect storm (each reconnect spends a rate-limit slot).
const HEARTBEAT_MS = 25_000;

router.get('/:householdId', requireAuth(), (req, res) => {
    // Required headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Tell the client to wait 10s before reconnecting (instead of the ~1s
    // default), so a flapping connection doesn't hammer the endpoint.
    res.write('retry: 10000\n\n');

    const householdId = req.params.householdId;

    addClient(Number(householdId), res);

    // Send an initial event
    res.write(`data: ${JSON.stringify({ message: 'connected' })}\n\n`);

    const heartbeat = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, HEARTBEAT_MS);

    // If client disconnects, stop the heartbeat and close.
    req.on('close', () => {
        clearInterval(heartbeat);
        res.end();
    });
});

export default router;
