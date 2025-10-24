"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var user_1 = require("../controllers/user");
var require_auth_1 = require("../middleware/require-auth");
var router = (0, express_1.Router)();
router.get('/', (0, require_auth_1.default)(), user_1.getUser);
router.post('/sync', (0, require_auth_1.default)(), user_1.syncUser);
exports.default = router;
