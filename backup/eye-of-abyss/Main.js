"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minecraftBot = exports.discordBot = exports.config = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const Config_1 = require("./Config");
const AbyssClient_1 = require("./AbyssClient");
const ChatHandler_1 = require("./handlers/ChatHandler");
const DeathHandler_1 = require("./handlers/DeathHandler");
const EndHandler_1 = require("./handlers/EndHandler");
const ErrorHandler_1 = require("./handlers/ErrorHandler");
const SpawnHandler_1 = require("./handlers/SpawnHandler");
const KickedHandler_1 = require("./handlers/KickedHandler");
const LoginHandler_1 = require("./handlers/LoginHandler");
const MinecraftBot_1 = require("./MinecraftBot");
const config = new Config_1.Config(process.argv[2]);
exports.config = config;
const start = process.argv[3] === "--start";
const discordBot = new AbyssClient_1.AbyssClient({
    "intents": [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent],
    "loadMessageCommandListeners": true,
    "loadDefaultErrorListeners": true,
    "loadSubcommandErrorListeners": true,
    "loadPlugins": true,
    "logger": { "level": framework_1.LogLevel.Debug }
});
exports.discordBot = discordBot;
const minecraftBot = new MinecraftBot_1.MinecraftBot([() => {
        new ErrorHandler_1.ErrorHandler();
        new ChatHandler_1.ChatHandler();
        new SpawnHandler_1.SpawnHandler();
        new KickedHandler_1.KickedHandler();
        new DeathHandler_1.DeathHandler();
        new LoginHandler_1.LoginHandler();
        new EndHandler_1.EndHandler();
    }]);
exports.minecraftBot = minecraftBot;
discordBot.login(config.get().discord.token).then(() => { if (start) {
    minecraftBot.connect();
} });
