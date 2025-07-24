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
exports.ServerCommand = void 0;
const plugin_subcommands_1 = require("@sapphire/plugin-subcommands");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class ServerCommand extends plugin_subcommands_1.Subcommand {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "server", "description": "Configures the host, port, and version the bot connects with.", "subcommands": [
                { "name": "host", "chatInputRun": "chatInputHost" },
                { "name": "port", "chatInputRun": "chatInputPort" },
                { "name": "version", "chatInputRun": "chatInputVersion" },
            ] }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addSubcommand(command => command.setName("host").setDescription("Sets the host the bot connects to.")
                .addStringOption(option => option.setName("host").setDescription("The host.").setRequired(true).setMinLength(1)))
                .addSubcommand(command => command.setName("port").setDescription("Sets the port the bot connects to.")
                .addStringOption(option => option.setName("port").setDescription("The port.").setRequired(true).setMinLength(1)))
                .addSubcommand(command => command.setName("version").setDescription("Sets the version the bot connects to.")
                .addStringOption(option => option.setName("version").setDescription("The version.").setRequired(true).setMinLength(1)));
        }, { "idHints": ["1226024642565767261"] });
    }
    chatInputHost(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const host = interaction.options.getString("host", true);
            Main_1.config.get().server.host = host;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.hostSet()] });
        });
    }
    chatInputPort(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const port = interaction.options.getString("port", true);
            Main_1.config.get().server.port = port;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.portSet()] });
        });
    }
    chatInputVersion(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const version = interaction.options.getString("version", true);
            Main_1.config.get().server.version = version;
            Main_1.config.save();
            return interaction.reply({ "embeds": [Embeds_1.Embeds.versionSet()] });
        });
    }
}
exports.ServerCommand = ServerCommand;
