"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHandler = void 0;
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class LoginHandler {
    constructor() {
        this.canSend = true;
        Main_1.minecraftBot.internal.on("login", () => {
            Main_1.minecraftBot.connected = true;
            if (Main_1.minecraftBot.internal.username && !Main_1.config.get().credentials.username) {
                Main_1.config.get().credentials.username = Main_1.minecraftBot.internal.username;
                Main_1.config.save();
            }
            if (this.canSend) {
                this.canSend = false;
                Main_1.discordBot.sendEmbed(Embeds_1.Embeds.connected(), Main_1.config.get().discord.infoChannelID);
                setTimeout(() => { this.canSend = true; }, 30000);
            }
        });
    }
}
exports.LoginHandler = LoginHandler;
