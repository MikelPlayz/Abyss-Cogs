"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsCreditor = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
class IsCreditor extends framework_1.Precondition {
    async messageRun(message) {
        return this.error({ "message": "This precondition is not supported." });
    }
    async chatInputRun(interaction) {
        return this.hasCreditorRole(interaction.member?.roles);
    }
    async contextMenuRun(interaction) {
        return this.hasCreditorRole(interaction.member?.roles);
    }
    async hasCreditorRole(roles) {
        const message = "You need the creditor role to assign currencies.";
        if (!roles || !(roles instanceof discord_js_1.GuildMemberRoleManager)) {
            return this.error({ "message": message });
        }
        return roles.member.roles.cache.some(role => role.name === "Creditor")
            ? this.ok()
            : this.error({ "message": message });
    }
}
exports.IsCreditor = IsCreditor;
