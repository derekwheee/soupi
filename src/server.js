"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("./app");
var PORT = Number(process.env.PORT) || 3000;
var HOST = process.env.HOST || '0.0.0.0';
var server = app_1.default.listen(PORT, HOST, function () {
    console.log("\uD83D\uDE80 Server running at http://".concat(HOST, ":").concat(PORT));
});
process.on('SIGTERM', function () {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(function () {
        console.log('Server closed');
        process.exit(0);
    });
});
