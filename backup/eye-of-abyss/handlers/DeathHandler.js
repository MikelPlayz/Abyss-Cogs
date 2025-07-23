"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeathHandler = void 0;
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class DeathHandler {
    constructor() {
        Main_1.minecraftBot.internal.on("death", () => { Main_1.discordBot.sendEmbed(Embeds_1.Embeds.death(), Main_1.config.get().discord.infoChannelID); });
    }
}
exports.DeathHandler = DeathHandler;
