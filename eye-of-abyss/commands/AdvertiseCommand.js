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
exports.AdvertiseCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
const Util_1 = require("../Util");
class AdvertiseCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "advertise", "aliases": ["ad", "advertisement"], "description": "Modifies the advertisements.", "subcommands": [
                { "name": "list", "chatInputRun": "chatInputList" },
                { "name": "info", "chatInputRun": "chatInputInfo" },
                { "name": "enable", "chatInputRun": "chatInputEnable" },
                { "name": "disable", "chatInputRun": "chatInputDisable" },
                { "name": "reset", "chatInputRun": "chatInputReset" },
                { "name": "add", "chatInputRun": "chatInputAdd", },
                { "name": "remove", "chatInputRun": "chatInputRemove" },
                { "name": "edit", "chatInputRun": "chatInputEdit" },
            ] }));
        for (const ad of Main_1.config.get().advertisements) {
            this.startAd(ad.name);
        }
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("list").setDescription("Shows all advertisements."))
                .addSubcommand(command => command.setName("info").setDescription("Show the specified advertisement.")
                .addStringOption(option => option.setName("name").setDescription("The name.").setMinLength(1).setRequired(true)))
                .addSubcommand(command => command.setName("enable").setDescription("Enables the advertisement.")
                .addStringOption(option => option.setName("name").setDescription("The name.").setMinLength(1).setRequired(true)))
                .addSubcommand(command => command.setName("disable").setDescription("Disables the advertisement.")
                .addStringOption(option => option.setName("name").setDescription("The name.").setMinLength(1).setRequired(true)))
                .addSubcommand(command => command.setName("reset").setDescription("Resets the advertisements."))
                .addSubcommand(command => command.setName("add").setDescription("Adds an advertisement.")
                .addStringOption(option => option.setName("name").setDescription("The name.").setMinLength(1).setRequired(true))
                .addStringOption(option => option.setName("text").setDescription("The text.").setMinLength(1).setRequired(true))
                .addNumberOption(option => option.setName("interval").setDescription("The interval in minutes.").setMinValue(1).setRequired(true))
                .addNumberOption(option => option.setName("randomizer").setDescription("The randomizer in minutes.").setMinValue(1).setRequired(true)))
                .addSubcommand(command => command.setName("remove").setDescription("Removes an advertisement.")
                .addStringOption(option => option.setName("name").setDescription("The name.").setMinLength(1).setRequired(true)))
                .addSubcommand(command => command.setName("edit").setDescription("Edits an advertisement.")
                .addStringOption(option => option.setName("name").setDescription("The name.").setMinLength(1).setRequired(true))
                .addStringOption(option => option.setName("text").setDescription("The text.").setMinLength(1).setRequired(false))
                .addNumberOption(option => option.setName("interval").setDescription("The interval in minutes.").setMinValue(1).setRequired(false))
                .addNumberOption(option => option.setName("randomizer").setDescription("The randomizer in minutes.").setMinValue(1).setRequired(false)));
        }, { "idHints": ["1226024560005087232"] });
    }
    chatInputList(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (Main_1.config.get().advertisements.length === 0) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adsEmpty()] });
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adList(Main_1.config.get().advertisements)] });
        });
    }
    chatInputInfo(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true).toLowerCase();
            const ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (!ad) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adNotFound()] });
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adInfo(ad)] });
        });
    }
    chatInputEnable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true).toLowerCase();
            const ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (!ad) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adNotFound()] });
            }
            ad.enable = true;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adEnabled()] });
        });
    }
    chatInputDisable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true).toLowerCase();
            const ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (!ad) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adNotFound()] });
            }
            ad.enable = false;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adDisabled()] });
        });
    }
    chatInputReset(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            Main_1.config.get().advertisements = [];
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adsReset()] });
        });
    }
    chatInputAdd(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true).toLowerCase();
            const text = interaction.options.getString("text", true);
            const interval = interaction.options.getNumber("interval", true);
            const randomizer = interaction.options.getNumber("randomizer", true);
            const ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (ad) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adAlreadyAdded(name)] });
            }
            Main_1.config.get().advertisements.push({ "enable": true, "name": name, "text": text, "interval": interval * 60000, "randomizer": randomizer * 60000 });
            Main_1.config.save();
            this.startAd(name);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adAdded(name)] });
        });
    }
    chatInputRemove(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true).toLowerCase();
            const ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (!ad) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adAlreadyRemoved(name)] });
            }
            Main_1.config.get().advertisements = Main_1.config.get().advertisements.filter((ad) => ad.name !== name);
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adRemoved(name)] });
        });
    }
    chatInputEdit(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true).toLowerCase();
            const text = interaction.options.getString("text", false);
            const interval = interaction.options.getNumber("interval", false);
            const randomizer = interaction.options.getNumber("randomizer", false);
            const ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (!ad) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.adAlreadyRemoved(name)] });
            }
            if (text) {
                ad.text = text;
            }
            if (interval) {
                ad.interval = interval * 60000;
            }
            if (randomizer) {
                ad.randomizer = randomizer * 60000;
            }
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.adEdited(name)] });
        });
    }
    startAd(name) {
        let ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
        if (!ad) {
            return;
        }
        setTimeout(() => {
            ad = Main_1.config.get().advertisements.find((ad) => ad.name === name);
            if (ad === null || ad === void 0 ? void 0 : ad.enable) {
                if (Main_1.minecraftBot.connected) {
                    Main_1.minecraftBot.chat(ad.text);
                }
                this.startAd(ad.name);
            }
        }, ad.interval + Util_1.Util.random(0, ad.randomizer));
    }
}
exports.AdvertiseCommand = AdvertiseCommand;
