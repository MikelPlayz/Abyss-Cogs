"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordClient = exports.currencySystem = exports.levelSystem = exports.config = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const Config_1 = require("./Config");
const CurrencySystem_1 = require("./CurrencySystem");
const DiscordClient_1 = require("./DiscordClient");
const LevelSystem_1 = require("./LevelSystem");
const Spreadsheet_1 = require("./Spreadsheet");
const config = new Config_1.Config("config.json");
exports.config = config;
const levelSystem = new LevelSystem_1.LevelSystem();
exports.levelSystem = levelSystem;
const currencySystem = new CurrencySystem_1.CurrencySystem(new Spreadsheet_1.Spreadsheet(config.get().spreadsheet.id, config.get().spreadsheet.clientEmail, config.get().spreadsheet.privateKey));
exports.currencySystem = currencySystem;
const discordClient = new DiscordClient_1.DiscordClient({
    "intents": [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent
    ],
    "loadMessageCommandListeners": true,
    "loadDefaultErrorListeners": true,
    "logger": { "level": framework_1.LogLevel.Debug }
});
exports.discordClient = discordClient;
discordClient.login(config.get()["token"]).then();
