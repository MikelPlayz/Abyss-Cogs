"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const Main_1 = require("../Main");
class ErrorHandler {
    constructor() {
        Main_1.minecraftBot.internal.on("error", (error) => {
            Main_1.minecraftBot.lastLog = { "type": "Error", "message": error.message };
            if (!error.message.includes("client timed out")) {
                Main_1.minecraftBot.allowAutoReconnect = false;
            }
        });
    }
}
exports.ErrorHandler = ErrorHandler;
