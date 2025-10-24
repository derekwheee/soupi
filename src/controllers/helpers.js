"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controller = controller;
exports.householdController = householdController;
var prisma_1 = require("../../prisma");
var express_1 = require("@clerk/express");
var he_1 = require("he");
function decodeEntitiesDeep(value) {
    if (typeof value === 'string') {
        return he_1.default.decode(value);
    }
    else if (Array.isArray(value)) {
        return value.map(decodeEntitiesDeep);
    }
    else if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(function (_a) {
            var k = _a[0], v = _a[1];
            return [k, decodeEntitiesDeep(v)];
        }));
    }
    return value;
}
function hasAccessToHousehold(userId_1, householdId_1) {
    return __awaiter(this, arguments, void 0, function (userId, householdId, skipAccessCheck) {
        if (skipAccessCheck === void 0) { skipAccessCheck = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.default.household.findFirst({
                        where: __assign({ id: householdId }, (skipAccessCheck ? {} : { members: { some: { id: userId } } }))
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function controller(req, res, fn) {
    return __awaiter(this, void 0, void 0, function () {
        var userId, json, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userId = (0, express_1.getAuth)(req).userId;
                    return [4 /*yield*/, fn(userId)];
                case 1:
                    json = _a.sent();
                    if (typeof json !== 'object') {
                        return [2 /*return*/, res.status(200).send(json)];
                    }
                    res.json(decodeEntitiesDeep(json));
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error(error_1);
                    res.status(500).json(error_1 instanceof Error ?
                        { error: error_1.message } :
                        { error: 'An unknown error occurred' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function householdController(req_1, res_1, fn_1) {
    return __awaiter(this, arguments, void 0, function (req, res, fn, _a) {
        var householdId, userId, household;
        var _b = _a === void 0 ? {} : _a, _c = _b.skipAccessCheck, skipAccessCheck = _c === void 0 ? false : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    householdId = Number(req.params.householdId);
                    if (isNaN(householdId)) {
                        res.status(400).json({ error: 'Invalid householdId parameter' });
                        return [2 /*return*/];
                    }
                    userId = (0, express_1.getAuth)(req).userId;
                    if (!userId) {
                        res.status(401).json({ error: 'Unauthorized' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, hasAccessToHousehold(userId, householdId, skipAccessCheck)];
                case 1:
                    household = _d.sent();
                    if (!household) {
                        res.status(403).json({ error: 'Access denied' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, controller(req, res, function () { return fn(household); })];
                case 2: return [2 /*return*/, _d.sent()];
            }
        });
    });
}
