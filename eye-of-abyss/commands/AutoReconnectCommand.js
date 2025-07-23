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
exports.AutoReconnectCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class AutoReconnectCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "autoreconnect", "description": "Manages auto-reconnection options.", "subcommands": [
                { "name": "enable", "chatInputRun": "chatInputEnable" },
                { "name": "disable", "chatInputRun": "chatInputDisable" },
                { "name": "interval", "chatInputRun": "chatInputInterval" },
            ] }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("enable").setDescription("Enables auto-reconnection."))
                .addSubcommand(command => command.setName("disable").setDescription("Disables auto-reconnection."))
                .addSubcommand(command => command.setName("interval").setDescription("Changes the auto-reconnection interval.")
                .addNumberOption(option => option.setName("interval").setDescription("The interval in seconds.").setRequired(true).setMinValue(60)));
        }, { "idHints": ["1226024641626247188"] });
    }
    chatInputEnable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().autoreconnect.enable = true;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.autoReconnectEnabled()] });
        });
    }
    chatInputDisable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().autoreconnect.enable = false;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.autoReconnectDisabled()] });
        });
    }
    chatInputInterval(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const interval = interaction.options.getNumber("interval", true);
            Main_1.config.get().autoreconnect.interval = interval * 1000;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.autoReconnectIntervalSet()] });
        });
    }
}
exports.AutoReconnectCommand = AutoReconnectCommand;
