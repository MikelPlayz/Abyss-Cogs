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
exports.PrivateWarpCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../../Embeds");
const Main_1 = require("../../Main");
class PrivateWarpCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "pw", "description": "Executes the /pw command.", "preconditions": ["PluginEnabled"] }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addStringOption(option => option.setName("name").setDescription("The name of the warp to teleport to.").setRequired(true).setMinLength(1));
        }, { "idHints": ["1226024197700976642"] });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            const name = interaction.options.getString("name", true);
            Main_1.minecraftBot.chat(`/pw ${name}`);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.commandExecuted()] });
        });
    }
}
exports.PrivateWarpCommand = PrivateWarpCommand;
