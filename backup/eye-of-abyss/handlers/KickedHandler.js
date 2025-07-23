"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KickedHandler = void 0;
const Main_1 = require("../Main");
class KickedHandler {
    constructor() {
        Main_1.minecraftBot.internal.on("kicked", (reason) => {
            Main_1.minecraftBot.lastLog = { "type": "Kicked", "message": reason };
            if (reason.includes("already connected to this proxy") || reason.includes("duplicate_login")) {
                Main_1.minecraftBot.allowAutoReconnect = false;
            }
        });
    }
}
exports.KickedHandler = KickedHandler;
