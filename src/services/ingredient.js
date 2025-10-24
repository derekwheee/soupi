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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIngredients = parseIngredients;
var prisma_1 = require("../../prisma");
var node_child_process_1 = require("node:child_process");
function parseIngredients(arg, isRetry) {
    return __awaiter(this, void 0, void 0, function () {
        var recipe, _a, ingredientSentences, python, parser, result, parsedIngredients, ingredients, updates, updatedRecipe;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(typeof arg === 'number')) return [3 /*break*/, 2];
                    return [4 /*yield*/, prisma_1.default.recipe.findUniqueOrThrow({
                            where: { id: arg },
                            include: { ingredients: true, tags: true },
                        })];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = arg;
                    _b.label = 3;
                case 3:
                    recipe = _a;
                    ingredientSentences = recipe.ingredients.map(function (_a) {
                        var sentence = _a.sentence;
                        return sentence;
                    });
                    python = process.env.NLP_PYTHON_PATH || 'python';
                    parser = process.env.NLP_PARSER_PATH;
                    if (!python || !parser)
                        throw new Error('NLP_PYTHON_PATH and NLP_PARSER_PATH are required');
                    result = (0, node_child_process_1.spawnSync)(python, [parser, '-j', JSON.stringify(ingredientSentences)], {
                        stdio: ['inherit', 'pipe', 'inherit'],
                        encoding: 'utf-8',
                    });
                    if (result.error) {
                        console.error('Failed to execute:', result.error);
                        throw new Error(result.error.message || String(result.error));
                    }
                    if (result.stdout.startsWith('Downloading')) {
                        // Retry once if the model is being downloaded
                        if (isRetry) {
                            throw new Error('NLP model is still downloading, please try again later');
                        }
                        return [2 /*return*/, parseIngredients(recipe, true)];
                    }
                    parsedIngredients = JSON.parse(result.stdout);
                    ingredients = recipe.ingredients.map(function (ingredient) {
                        var _a, _b, _c, _d, _e;
                        var parsed = parsedIngredients.find(function (parsed) { return parsed.sentence === ingredient.sentence; });
                        return __assign(__assign({}, ingredient), { item: (_a = parsed === null || parsed === void 0 ? void 0 : parsed.name) === null || _a === void 0 ? void 0 : _a[0].text, size: (_b = parsed === null || parsed === void 0 ? void 0 : parsed.size) === null || _b === void 0 ? void 0 : _b.text, amount: (_c = parsed === null || parsed === void 0 ? void 0 : parsed.amount[0]) === null || _c === void 0 ? void 0 : _c.quantity, unit: (_d = parsed === null || parsed === void 0 ? void 0 : parsed.amount[0]) === null || _d === void 0 ? void 0 : _d.unit, preparation: (_e = parsed === null || parsed === void 0 ? void 0 : parsed.preparation) === null || _e === void 0 ? void 0 : _e.text, json: parsed });
                    });
                    updates = ingredients.map(function (_a) {
                        var id = _a.id, ingredient = __rest(_a, ["id"]);
                        return prisma_1.default.ingredient.update({
                            where: { id: id },
                            data: ingredient
                        });
                    });
                    return [4 /*yield*/, Promise.all(updates)];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, prisma_1.default.recipe.findUniqueOrThrow({
                            where: { id: recipe.id },
                            include: { ingredients: true, tags: true },
                        })];
                case 5:
                    updatedRecipe = _b.sent();
                    return [2 /*return*/, updatedRecipe];
            }
        });
    });
}
