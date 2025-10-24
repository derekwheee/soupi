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
exports.getAllRecipes = getAllRecipes;
exports.getRecipe = getRecipe;
exports.createRecipeFromUrl = createRecipeFromUrl;
exports.upsertRecipe = upsertRecipe;
exports.deleteRecipe = deleteRecipe;
exports.getAllRecipeTags = getAllRecipeTags;
var prisma_1 = require("../../prisma");
var ingredient_1 = require("./ingredient");
var scraper_1 = require("./scraper");
var sse_1 = require("../../utils/sse");
var constants_1 = require("../../utils/constants");
function getAllRecipes(householdId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // broadcast(householdId, {
            //     type: SSEMessageType.RECIPE_UPDATE,
            //     from: 'getAllRecipes',
            //     data: {},
            // });
            return [2 /*return*/, prisma_1.default.recipe.findMany({
                    where: { householdId: householdId, deletedAt: null },
                    include: {
                        ingredients: { orderBy: { id: 'asc' } },
                        tags: { orderBy: { id: 'asc' } },
                    },
                })];
        });
    });
}
function getRecipe(householdId, id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.default.recipe.findUniqueOrThrow({
                    where: { id: id, householdId: householdId },
                    include: {
                        ingredients: { orderBy: { id: 'asc' } },
                        tags: { orderBy: { id: 'asc' } },
                    },
                })];
        });
    });
}
function createRecipeFromUrl(householdId, url) {
    return __awaiter(this, void 0, void 0, function () {
        var recipeData, recipe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, scraper_1.scrapeRecipe)(url)];
                case 1:
                    recipeData = _a.sent();
                    if (!recipeData) {
                        throw new Error('Failed to scrape recipe from URL');
                    }
                    recipe = {
                        name: recipeData.name || 'Untitled Recipe',
                        prepTime: parseTimes(recipeData.prepTime),
                        cookTime: parseTimes(recipeData.cookTime),
                        servings: recipeData.servings,
                        instructions: recipeData.instructions,
                        ingredients: recipeData.ingredients,
                    };
                    return [2 /*return*/, upsertRecipe(householdId, recipe)];
            }
        });
    });
}
function upsertRecipe(householdId, patch) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, sse_1.broadcast)(householdId, constants_1.SSEMessageType.RECIPE_UPDATE, 'upsertRecipe', function () { return __awaiter(_this, void 0, void 0, function () {
                        var id, ingredients, _a, tags, data, updatedRecipe;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    id = patch.id, ingredients = patch.ingredients, _a = patch.tags, tags = _a === void 0 ? [] : _a, data = __rest(patch, ["id", "ingredients", "tags"]);
                                    if (!!id) return [3 /*break*/, 2];
                                    return [4 /*yield*/, prisma_1.default.recipe.create({
                                            data: __assign(__assign({}, data), { householdId: householdId, tags: {
                                                    connectOrCreate: tags.map(function (tag) { return ({
                                                        where: { name: tag.name, householdId: householdId },
                                                        create: { name: tag.name, householdId: householdId },
                                                    }); }),
                                                } }),
                                        })];
                                case 1:
                                    updatedRecipe = _b.sent();
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, prisma_1.default.recipe.update({
                                        where: { id: id, householdId: householdId },
                                        data: __assign(__assign({}, data), { tags: {
                                                set: [],
                                                connectOrCreate: tags.map(function (tag) { return ({
                                                    where: { name: tag.name, householdId: householdId },
                                                    create: { name: tag.name, householdId: householdId },
                                                }); }),
                                            } }),
                                    })];
                                case 3:
                                    updatedRecipe = _b.sent();
                                    _b.label = 4;
                                case 4: return [2 /*return*/, processIngredients(updatedRecipe, ingredients)];
                            }
                        });
                    }); })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function deleteRecipe(householdId, id) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            (0, sse_1.broadcast)(householdId, constants_1.SSEMessageType.RECIPE_DELETE, 'deleteRecipe', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, prisma_1.default.recipe.update({
                                where: { id: id, householdId: householdId },
                                data: { deletedAt: new Date() },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
function getAllRecipeTags(householdId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma_1.default.recipeTag.findMany({
                    where: { recipes: { every: { householdId: householdId } } },
                    orderBy: { name: 'asc' },
                })];
        });
    });
}
var processIngredients = function (recipe, ingredients) { return __awaiter(void 0, void 0, void 0, function () {
    var newIngredients;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(ingredients && ingredients.length > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma_1.default.ingredient.deleteMany({
                        where: { recipeId: recipe.id },
                    })];
            case 1:
                _a.sent();
                return [4 /*yield*/, prisma_1.default.ingredient.createManyAndReturn({
                        data: ingredients.map(function (sentence) { return ({
                            recipeId: recipe.id,
                            sentence: sentence,
                        }); }),
                    })];
            case 2:
                newIngredients = _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/, (0, ingredient_1.parseIngredients)(__assign(__assign({}, recipe), { ingredients: newIngredients || ingredients || [] }))];
        }
    });
}); };
var parseTimes = function (time) {
    if (!time)
        return time;
    if (time.match(/PT\d+\w+/)) {
        var _a = /(\d+)(\w+)/.exec(time) || [], minutes = _a[1], flag = _a[2];
        var parsed = '';
        if (flag === 'M') {
            var mins = Number(minutes);
            var hours = Math.floor(mins / 60);
            var remMinutes = mins % 60;
            if (hours > 0) {
                parsed += "".concat(hours, " hour").concat(hours > 1 ? 's ' : ' ');
            }
            if (remMinutes > 0) {
                parsed += "".concat(remMinutes, " min").concat(remMinutes > 1 ? 's' : '');
            }
            return parsed.trim();
        }
    }
    return time;
};
