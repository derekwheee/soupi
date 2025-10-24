"use strict";
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
exports.scrapeRecipe = scrapeRecipe;
var puppeteer_1 = require("puppeteer");
var mistral_1 = require("@ai-sdk/mistral");
var ai_1 = require("ai");
var zod_1 = require("zod");
function cleanInstructions(recipeInstructions) {
    var instructions = Array.isArray(recipeInstructions)
        ? recipeInstructions.map(function (step) {
            return typeof step === 'string' ? step : step.text;
        })
        : [];
    return instructions
        .map(function (step) {
        return step
            .replace(/\s*<[^>]*>\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    })
        .filter(function (step) { return step.length > 0 && /\s/.test(step); });
}
function scrapeRecipe(url) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, textToParse, parsed, recipe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_1.default.launch({
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-extensions',
                            '--disable-gpu',
                        ],
                    })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    if (!url.toLowerCase().includes('tiktok.com')) return [3 /*break*/, 4];
                    return [4 /*yield*/, getTikTokRecipe(page, url)];
                case 3:
                    textToParse = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, parseWebsiteRecipe(page, url)];
                case 5:
                    textToParse = _a.sent();
                    _a.label = 6;
                case 6:
                    if (!!textToParse) return [3 /*break*/, 8];
                    console.error('No text to parse found.');
                    return [4 /*yield*/, browser.close()];
                case 7:
                    _a.sent();
                    return [2 /*return*/, null];
                case 8: return [4 /*yield*/, (0, ai_1.generateObject)({
                        model: (0, mistral_1.mistral)('mistral-large-latest'),
                        schema: zod_1.z.object({
                            name: zod_1.z.string(),
                            prepTime: zod_1.z.string().optional(),
                            cookTime: zod_1.z.string().optional(),
                            servings: zod_1.z.number().min(1).optional(),
                            ingredients: zod_1.z.array(zod_1.z.string()),
                            instructions: zod_1.z.array(zod_1.z.string()),
                        }),
                        prompt: "\n            Parse the following text into a recipe and format it as JSON.\n            If you're not confident about any field, omit it.\n            The text may be plain text, or a string of JSON-LD from a webpage.\n            The text may contain extraneous information, so only include relevant recipe details.\n            ".concat(textToParse, "\n        "),
                    })];
                case 9:
                    parsed = _a.sent();
                    recipe = parsed === null || parsed === void 0 ? void 0 : parsed.object;
                    return [4 /*yield*/, browser.close()];
                case 10:
                    _a.sent();
                    return [2 /*return*/, recipe
                            ? {
                                name: recipe.name,
                                prepTime: parseTimes(recipe.prepTime) || null,
                                cookTime: parseTimes(recipe.cookTime) || null,
                                servings: recipe.servings || null,
                                ingredients: recipe.ingredients || [],
                                instructions: cleanInstructions(recipe.instructions) || [],
                            }
                            : null];
            }
        });
    });
}
function parseWebsiteRecipe(page, url) {
    return __awaiter(this, void 0, void 0, function () {
        var ldJsonElement, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, page.goto(url, {
                        waitUntil: 'domcontentloaded',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, page.$('script[type="application/ld+json"]')];
                case 2:
                    ldJsonElement = _b.sent();
                    if (!ldJsonElement) return [3 /*break*/, 4];
                    return [4 /*yield*/, ldJsonElement.evaluate(function (el) { return el.innerText; })];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _b.label = 5;
                case 5: return [2 /*return*/, _a];
            }
        });
    });
}
function getTikTokRecipe(page, url) {
    return __awaiter(this, void 0, void 0, function () {
        var metaTags;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, page.goto(url, {
                        waitUntil: 'networkidle2',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var metaElements = Array.from(document.head.querySelectorAll('meta'));
                            return metaElements.map(function (meta) {
                                var attributes = {};
                                for (var _i = 0, _a = meta.attributes; _i < _a.length; _i++) {
                                    var attr = _a[_i];
                                    attributes[attr.name] = attr.value;
                                }
                                return attributes;
                            });
                        })];
                case 2:
                    metaTags = _b.sent();
                    return [2 /*return*/, (_a = metaTags === null || metaTags === void 0 ? void 0 : metaTags.find(function (tag) { return tag.property === 'og:description'; })) === null || _a === void 0 ? void 0 : _a.content];
            }
        });
    });
}
function parseTimes(time) {
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
}
