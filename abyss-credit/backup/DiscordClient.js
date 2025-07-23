"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordClient = void 0;
const framework_1 = require("@sapphire/framework");
class DiscordClient extends framework_1.SapphireClient {
    constructor(options) {
        super(options);
    }
    async send(channelID, message) {
        if (message.trim().length === 0) {
            return Promise.resolve();
        }
        await this.channels.cache.get(channelID).send(message);
    }
    async sendEmbed(channelID, embed) {
        await this.channels.cache.get(channelID).send({ "embeds": [embed] });
    }
}
exports.DiscordClient = DiscordClient;
