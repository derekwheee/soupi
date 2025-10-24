"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var helpers_1 = require("../controllers/helpers");
var package_json_1 = require("../../package.json");
var router = (0, express_1.Router)();
router.get('/', function (res, req) { return (0, helpers_1.controller)(res, req, function () {
    return {
        name: "soupi",
        version: package_json_1.default.version,
        status: "ok"
    };
}); });
exports.default = router;
