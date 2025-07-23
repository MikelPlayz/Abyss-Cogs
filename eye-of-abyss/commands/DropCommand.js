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
exports.DropCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class DropCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "drop", "description": "Drops items from the bot's inventory, armor, mainhand, or offhand.", "subcommands": [
                { "name": "inventory", "chatInputRun": "chatInputInventory" },
                { "name": "armor", "chatInputRun": "chatInputArmor" },
                { "name": "offhand", "chatInputRun": "chatInputOffhand" },
                { "name": "mainhand", "chatInputRun": "chatInputMainhand" }
            ] }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("inventory").setDescription("Drops the bot's inventory."))
                .addSubcommand(command => command.setName("armor").setDescription("Drops the bot's armor."))
                .addSubcommand(command => command.setName("offhand").setDescription("Drops the bot's offhand."))
                .addSubcommand(command => command.setName("mainhand").setDescription("Drops the bot's mainhand."));
        }, { "idHints": ["1226024471543021688"] });
    }
    chatInputInventory(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            this.drop([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.inventoryDropped()] });
        });
    }
    chatInputArmor(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            this.drop([5, 6, 7, 8]);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.armorDropped()] });
        });
    }
    chatInputOffhand(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            this.drop([45]);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.offhandDropped()] });
        });
    }
    chatInputMainhand(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            this.drop([Main_1.minecraftBot.internal.quickBarSlot]);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.mainhandDropped()] });
        });
    }
    drop(slots) {
        let i = 0;
        for (const slot of slots) {
            const item = Main_1.minecraftBot.internal.inventory.slots[slot];
            if (item) {
                setTimeout(() => { Main_1.minecraftBot.internal.tossStack(item); }, i * 1000);
                i++;
            }
        }
    }
}
exports.DropCommand = DropCommand;
