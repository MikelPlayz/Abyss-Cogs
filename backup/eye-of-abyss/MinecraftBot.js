"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinecraftBot = void 0;
const mineflayer_1 = require("mineflayer");
const Main_1 = require("./Main");
class MinecraftBot {
    constructor(startup) {
        this.connected = false;
        this.lastLog = undefined;
        this.startup = startup;
        this.allowAutoReconnect = true;
    }
    connect() {
        this.internal = (0, mineflayer_1.createBot)({ "username": Main_1.config.get().credentials.email, "password": Main_1.config.get().credentials.password, "auth": Main_1.config.get().credentials.auth, "host": Main_1.config.get().server.host, "port": Main_1.config.get().server.port, "version": Main_1.config.get().server.version });
        if (!this.autoReconnectInterval) {
            this.autoReconnectInterval = setInterval(() => { if (Main_1.config.get().autoreconnect.enable && this.allowAutoReconnect && !this.connected) {
                this.connect();
            } }, Main_1.config.get().autoreconnect.interval);
        }
        for (const startup of this.startup) {
            startup();
        }
    }
    disconnect() {
        this.internal.quit();
    }
    chat(message) {
        if (Main_1.minecraftBot.connected && message.trim().length > 0) {
            this.internal.chat(message);
        }
    }
}
exports.MinecraftBot = MinecraftBot;
