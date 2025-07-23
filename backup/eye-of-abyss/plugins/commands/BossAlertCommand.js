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
exports.BossAlertCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../../Embeds");
const Main_1 = require("../../Main");
class BossAlertCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "bossalert", "description": "Manages the boss alert configuration.", "preconditions": ["PluginEnabled"], "subcommands": [
                { "name": "enable", "chatInputRun": "chatInputEnable" },
                { "name": "disable", "chatInputRun": "chatInputDisable" }
            ] }));
        // Set our inital values.
        this.bosses = ["queenbee", "levian", "minotaur", "valkyrie", "azalea", "starserpent", "warden", "wither", "enderdragon", "soulknight", "yukima", "erebus", "thanatos"];
        this.bossIndex = 0;
        this.enable = true;
        this.blockedPings = [];
        if (!Main_1.config.get().plugins.includes("bossalert")) {
            return;
        }
        // Warp through all bosses every 15 seconds (+5 seconds because of /warp command delay).
        setInterval(() => {
            if (!Main_1.minecraftBot.connected || !this.enable) {
                return;
            }
            Main_1.minecraftBot.chat(`/warp ${this.bosses[this.bossIndex]}`);
            // Increment the index if we're not at the end of the list. Set it back to 0 if we are.
            if (this.bossIndex == this.bosses.length - 1) {
                this.bossIndex = 0;
            }
            else {
                this.bossIndex += 1;
            }
        }, 15000);
        // Send a message to discord when the bossBarCreated event is activated. 
        Main_1.minecraftBot.startup.push(() => {
            Main_1.minecraftBot.internal.on("bossBarCreated", (bossBar) => {
                if (!this.enable) {
                    return;
                }
                if (!this.blockedPings.includes(bossBar.entityUUID)) {
                    Main_1.discordBot.sendEmbed(Embeds_1.Embeds.template(`${bossBar.title}`, "<@&1229668800291405935>"), "1123358693447192617");
                    // Block the attempt to send a message for the corresponding boss for the next ten minutes.
                    this.blockedPings.push(bossBar.entityUUID);
                    setTimeout(() => { this.blockedPings = this.blockedPings.filter(blockedPing => blockedPing !== bossBar.entityUUID); }, 600000);
                }
            });
        });
    }
    // Register the command and it's structure.
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("enable").setDescription("Enables the boss-alert system."))
                .addSubcommand(command => command.setName("disable").setDescription("Disables the boss-alert system."));
        }, { "idHints": ["1229582773866463263"] });
    }
    // Ran on /bossalert enable.
    chatInputEnable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            this.enable = true;
	    Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.template("Boss-Alert System Disabled")] });
        });
    }
    // Ran on /bossalert disable.
    chatInputDisable(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            this.enable = false;
	    Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.template("Boss-Alert System Enabled")] });
        });
    }
}
exports.BossAlertCommand = BossAlertCommand;
