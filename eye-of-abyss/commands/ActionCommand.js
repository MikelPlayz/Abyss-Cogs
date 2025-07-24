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
exports.ActionCommand = void 0;
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
class ActionCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "action", "description": "Performs an action.", "subcommands": [
                { "name": "interval", "chatInputRun": "chatInputInterval" },
                { "name": "once", "chatInputRun": "chatInputOnce" },
                { "name": "stop", "chatInputRun": "chatInputStop" }
            ] }));
        this.intervals = new Map();
        this.initializeActions();
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("interval").setDescription("Performs an action at the set interval.")
                .addStringOption(option => this.createChoices(option).setName("action").setDescription("The action.").setRequired(true).setMinLength(1))
                .addNumberOption(option => option.setName("time").setDescription("The interval in minutes for the action to be performed.").setRequired(true).setMinValue(1)))
                .addSubcommand(command => command.setName("once").setDescription("Performs an action for the set time.")
                .addStringOption(option => this.createChoices(option).setName("action").setDescription("The action.").setRequired(true).setMinLength(1))
                .addNumberOption(option => option.setName("time").setDescription("The time in seconds for the action to be performed.").setRequired(false).setMinValue(1)))
                .addSubcommand(command => command.setName("stop").setDescription("Stops an action.")
                .addStringOption(option => this.createChoices(option).setName("action").setDescription("The action.").setRequired(false).setMinLength(1)));
        }, { "idHints": ["1226024555659919372"] });
    }
    createChoices(option) {
        return option.addChoices({ "name": "left", "value": "left" }, { "name": "right", "value": "right" }, { "name": "forward", "value": "forward" }, { "name": "back", "value": "back" }, { "name": "jump", "value": "jump" }, { "name": "sprint", "value": "sprint" }, { "name": "sneak", "value": "sneak" });
    }
    chatInputInterval(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.template("Disabled Command", "This command is disabled because it could potentially get us banned.")] });
            // const action: string = interaction.options.getString("action", true);
            // const interval: number = interaction.options.getNumber("time", true);
            // this.createActionInterval(action, interval * 60_000);
            // this.startActionInterval(action, interval * 60_000);
            // return interaction.reply({ "embeds": [Embeds.actionStarted()] });
        });
    }
    chatInputOnce(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            const action = interaction.options.getString("action", true);
            const time = (_a = interaction.options.getNumber("time", false)) !== null && _a !== void 0 ? _a : 1;
            this.startActionOnce(action, time * 1000);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.actionStarted()] });
        });
    }
    chatInputStop(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            if (!Main_1.minecraftBot.connected) {
                return interaction.reply({ "embeds": [Embeds_1.Embeds.offline()] });
            }
            const action = interaction.options.getString("action", false);
            if (action) {
                this.stopAction(action);
            }
            else {
                this.stopActions();
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.actionStopped()] });
        });
    }
    createActionInterval(action, interval) {
        Main_1.config.get().actions[action] = interval;
        Main_1.config.save();
    }
    startActionInterval(action, interval) {
        if (interval <= 0) {
            return;
        }
        this.intervals.set(action, setInterval(() => {
            if (Main_1.minecraftBot.connected) {
                Main_1.minecraftBot.internal.setControlState(action, true);
                setTimeout(() => { Main_1.minecraftBot.internal.setControlState(action, false); }, 500);
            }
        }, interval));
    }
    startActionOnce(action, time) {
        if (time <= 0) {
            return;
        }
        Main_1.minecraftBot.internal.setControlState(action, true);
        setTimeout(() => { Main_1.minecraftBot.internal.setControlState(action, false); }, time);
    }
    initializeActions() {
        for (const action in Main_1.config.get().actions) {
            this.startActionInterval(action, Main_1.config.get().actions[action]);
        }
    }
    stopAction(action) {
        clearInterval(this.intervals.get(action));
        Main_1.minecraftBot.internal.setControlState(action, false);
        Main_1.config.get().actions[action] = 0;
        Main_1.config.save();
    }
    stopActions() {
        for (const action in Main_1.config.get().actions) {
            this.stopAction(action);
        }
    }
}
exports.ActionCommand = ActionCommand;
