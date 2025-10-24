"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var household_1 = require("../controllers/household");
var router = (0, express_1.Router)();
router.post('/household/:householdId/join', household_1.joinHousehold);
exports.default = router;
