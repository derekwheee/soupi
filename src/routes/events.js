"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server.js
var express_1 = require("express");
var sse_1 = require("../../utils/sse");
var router = (0, express_1.Router)();
router.get('/:householdId', function (req, res) {
    // Required headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    var householdId = req.params.householdId;
    (0, sse_1.addClient)(Number(householdId), res);
    // Send an initial event
    res.write("data: ".concat(JSON.stringify({ message: 'connected' }), "\n\n"));
    // If client disconnects, stop sending
    req.on('close', function () {
        res.end();
    });
});
exports.default = router;
