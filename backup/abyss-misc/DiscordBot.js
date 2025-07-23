"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_akairo_1 = require("discord-akairo");
const Config_1 = __importDefault(require("./Config"));
class DiscordBot extends discord_akairo_1.AkairoClient {
    constructor() {
        super();
        this.commandHandler = new discord_akairo_1.CommandHandler(this, {});
        this.inhibitorHandler = new discord_akairo_1.InhibitorHandler(this, {});
        this.listenerHandler = new discord_akairo_1.ListenerHandler(this, {});
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.token = Config_1.default.token;
    }
    start() {
        if (this.token !== null && this.token !== undefined) {
            this.login(this.token).then();
        }
    }
    stop() {
        this.destroy();
    }
    registerCommand(command) {
        this.commandHandler.register(command);
    }
    registerInhibitor(inhibitor) {
        this.inhibitorHandler.register(inhibitor);
    }
    registerListener(listener) {
        this.listenerHandler.register(listener);
    }
    send(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.trim().length === 0) {
                return Promise.resolve();
            }
            yield this.channels.cache.get(Config_1.default.channelID).send(message);
        });
    }
    sendEmbed(embed) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.channels.cache.get(Config_1.default.channelID).send(embed);
        });
    }
}
exports.DiscordBot = DiscordBot;
