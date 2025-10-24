"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireAuth;
var express_1 = require("@clerk/express");
function requireAuth() {
    return function (req, res, next) {
        var userId = (0, express_1.getAuth)(req).userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    };
}
