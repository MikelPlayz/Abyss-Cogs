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
exports.FilterCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class FilterCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "filter", "description": "Modifies the filter.", "subcommands": [
                { "name": "list", "chatInputRun": "chatInputList", },
                { "name": "enable", "chatInputRun": "chatInputEnable" },
                { "name": "disable", "chatInputRun": "chatInputDisable" },
                { "name": "reset", "chatInputRun": "chatInputReset" },
                { "name": "add", "chatInputRun": "chatInputAdd" },
                { "name": "remove", "chatInputRun": "chatInputRemove" },
                { "name": "paste", "chatInputRun": "chatInputPaste" }
            ] }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("list").setDescription("Shows all items on the filter."))
                .addSubcommand(command => command.setName("enable").setDescription("Enables the filter."))
                .addSubcommand(command => command.setName("disable").setDescription("Disables the filter."))
                .addSubcommand(command => command.setName("reset").setDescription("Resets the filter."))
                .addSubcommand(command => command.setName("add").setDescription("Adds an item to the filter.")
                .addStringOption(option => option.setName("item").setDescription("The item.").setMinLength(1).setRequired(true)))
                .addSubcommand(command => command.setName("remove").setDescription("Removes an item from the filter.")
                .addStringOption(option => option.setName("item").setDescription("The item.").setMinLength(1).setRequired(true)))
                .addSubcommand(command => command.setName("paste").setDescription("Pastes a list to the filter.")
                .addStringOption(option => option.setName("list").setDescription("The list.").setMinLength(1).setRequired(true)));
        }, { "idHints": ["1226024472700653630"] });
    }
    chatInputList(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (Main_1.config.get().filter.list.length === 0) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.filterEmpty()] });
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterList(Main_1.config.get().filter.list)] });
        });
    }
    chatInputEnable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().filter.enable = true;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterEnabled()] });
        });
    }
    chatInputDisable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().filter.enable = false;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterDisabled()] });
        });
    }
    chatInputReset(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().filter.list = [];
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterReset()] });
        });
    }
    chatInputAdd(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const item = interaction.options.getString("item", true);
            if (Main_1.config.get().filter.list.includes(item)) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.filterAlreadyAdded(item)] });
            }
            Main_1.config.get().filter.list.push(item);
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterAdded(item)] });
        });
    }
    chatInputRemove(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const item = interaction.options.getString("item", true);
            if (Main_1.config.get().filter.list.includes(item)) {
                Main_1.config.get().filter.list = Main_1.config.get().filter.list.filter((element) => element !== item);
                Main_1.config.save();
                return interaction.reply({ "embeds": [Embeds_1.Embeds.filterRemoved(item)] });
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterAlreadyRemoved(item)] });
        });
    }
    chatInputPaste(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const list = interaction.options.getString("list", true);
            Main_1.config.get().filter.list = list.split(", ");
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.filterPasted()] });
        });
    }
}
exports.FilterCommand = FilterCommand;
