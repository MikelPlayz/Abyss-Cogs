"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsValidChannel = void 0;
const framework_1 = require("@sapphire/framework");
const Main_1 = require("../Main");
class IsValidChannel extends framework_1.Precondition {
    async messageRun(message) {
        return this.error({ "message": "This precondition is not supported." });
    }
    async chatInputRun(interaction) {
        return this.isValidChannel(interaction.channelId);
    }
    async contextMenuRun(interaction) {
        return this.isValidChannel(interaction.channelId);
    }
    async isValidChannel(channelId) {
        return Main_1.config.get().channels.includes(channelId)
            ? this.ok()
            : this.error({ "message": "You cannot use that command in this channel." });
    }
}
exports.IsValidChannel = IsValidChannel;
