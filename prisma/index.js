"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var extension_accelerate_1 = require("@prisma/extension-accelerate");
var prisma = new client_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
exports.default = prisma;
