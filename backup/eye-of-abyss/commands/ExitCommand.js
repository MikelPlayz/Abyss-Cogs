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
exports.ExitCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const process_1 = require("process");
const Main_1 = require("../Main");
class ExitCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "exit", "description": "Exits the program after ten seconds." }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description);
        }, { "idHints": ["1226024557899550833"] });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Main_1.config.get().discord.chatChannelID !== interaction.channelId) {
                return;
            }
            setTimeout(() => (0, process_1.exit)(), 10000);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.exiting()] });
        });
    }
}
exports.ExitCommand = ExitCommand;
