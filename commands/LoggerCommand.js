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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class LoggingCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "logger", "description": "Enables or disables the logger.", "subcommands": [
                { "name": "enable", "chatInputRun": "chatInputEnable" },
                { "name": "disable", "chatInputRun": "chatInputDisable" }
            ] }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("enable").setDescription("Enables the logger."))
                .addSubcommand(command => command.setName("disable").setDescription("Disables the logger."));
        }, { "idHints": ["1226024475188006964"] });
    }
    chatInputEnable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().logging.enable = true;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.loggerEnabled()] });
        });
    }
    chatInputDisable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().logging.enable = false;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.loggerDisabled()] });
        });
    }
}
exports.LoggingCommand = LoggingCommand;
