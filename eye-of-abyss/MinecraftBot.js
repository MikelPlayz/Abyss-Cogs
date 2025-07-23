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
        this.reconnectAttempts = 0;  // NEW: Track how many times we've retried
    }

    connect() {
        const maxAttempts = Main_1.config.get().autoreconnect.maxAttempts ?? Infinity;

        if (this.reconnectAttempts >= maxAttempts) {
            console.log(`[Bot] Reached max reconnect attempts (${maxAttempts}). Stopping further reconnects.`);
            this.allowAutoReconnect = false;
            return;
        }

        console.log(`[Bot] Connecting... attempt ${this.reconnectAttempts + 1}/${maxAttempts}`);
        this.reconnectAttempts++;

        this.internal = (0, mineflayer_1.createBot)({
            "username": Main_1.config.get().credentials.email,
            "password": Main_1.config.get().credentials.password,
            "auth": Main_1.config.get().credentials.auth,
            "host": Main_1.config.get().server.host,
            "port": Main_1.config.get().server.port,
            "version": Main_1.config.get().server.version
        });

        this.internal.once("login", () => {
            this.connected = true;
            console.log("[Bot] Successfully connected.");
            if (Main_1.config.get().autoreconnect.resetAfterSuccess) {
                this.reconnectAttempts = 0;
            }
        });

        this.internal.once("end", () => {
            this.connected = false;
            console.log("[Bot] Disconnected from server.");
        });

        if (!this.autoReconnectInterval) {
            this.autoReconnectInterval = setInterval(() => {
                if (
                    Main_1.config.get().autoreconnect.enable &&
                    this.allowAutoReconnect &&
                    !this.connected
                ) {
                    this.connect();
                }
            }, Main_1.config.get().autoreconnect.interval);
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
