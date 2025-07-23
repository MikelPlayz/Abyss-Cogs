"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordBot = exports.config = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const Config_1 = require("./Config");
const AbyssClient_1 = require("./AbyssClient");
const Timestamp_1 = require("./Timestamp");
const config = new Config_1.Config("config.json");
exports.config = config;
const discordBot = new AbyssClient_1.AbyssClient({
    "intents": [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.GuildMembers, discord_js_1.GatewayIntentBits.MessageContent],
    "loadMessageCommandListeners": true,
    "loadDefaultErrorListeners": true,
    "logger": { "level": framework_1.LogLevel.Debug }
});
exports.discordBot = discordBot;
discordBot.on("guildMemberRemove", (member) => {
    var _a;
    const embed = {
        "title": `${member.user.username} has left the guild!`,
        "color": 16711680,
        "fields": [{ "name": "Username", "value": member.user.username, "inline": true }],
        "thumbnail": { "url": `${member.user.displayAvatarURL()}` },
        "footer": { "text": Timestamp_1.Timestamp.now() }
    };
    if (member.nickname) {
        (_a = embed.fields) === null || _a === void 0 ? void 0 : _a.push({ "name": "IGN", "value": member.nickname, "inline": true });
    }
    discordBot.sendEmbed(embed).then();
});
discordBot.login(config.get().token).then();
