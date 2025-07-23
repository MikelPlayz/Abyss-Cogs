"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndHandler = void 0;
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class EndHandler {
    constructor() {
        Main_1.minecraftBot.internal.on("end", () => {
            Main_1.minecraftBot.connected = false;
            if (Main_1.minecraftBot.lastLog) {
                Main_1.discordBot.sendEmbed(Embeds_1.Embeds.disconnected(Main_1.minecraftBot.lastLog), Main_1.config.get().discord.infoChannelID);
                Main_1.minecraftBot.lastLog = undefined;
                return;
            }
            Main_1.discordBot.sendEmbed(Embeds_1.Embeds.disconnected(), Main_1.config.get().discord.infoChannelID);
        });
    }
}
exports.EndHandler = EndHandler;
