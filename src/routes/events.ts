// server.js
import { Router } from 'express';
import { addClient } from '../../utils/sse';

const router = Router();

router.get('/:householdId', (req, res) => {
    // Required headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const householdId = req.params.householdId;

    addClient(Number(householdId), res);

    // Send an initial event
    res.write(`data: ${JSON.stringify({ message: 'connected' })}\n\n`);

    // If client disconnects, stop sending
    req.on('close', () => {
        res.end();
    });
});

export default router;
