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
exports.LevelCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class LevelCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "level", "preconditions": ["IsValidChannel"], "description": "Returns the level of the designated user." }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addUserOption(option => option.setName("user").setDescription("The user to check the level of.").setRequired(false));
        }, { "idHints": ["1225881895422656564"] });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let user = (_a = interaction.options.getUser("user", false)) !== null && _a !== void 0 ? _a : interaction.user;
            return interaction.reply({ "embeds": [Embeds_1.Embeds.level(user, Main_1.levelSystem.findXp(user.id), Main_1.levelSystem.findTotalXp(user.id), Main_1.levelSystem.findLevel(user.id))] }).then();
        });
    }
}
exports.LevelCommand = LevelCommand;
