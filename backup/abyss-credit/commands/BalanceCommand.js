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
exports.BalanceCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class BalanceCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "balance", "preconditions": ["IsValidChannel"], "description": "Returns the balance of the designated user." }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addUserOption(option => option.setName("user").setDescription("The user to check the balance of.").setRequired(false));
        }, { "idHints": ["1225881897213890601"] });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let user = (_a = interaction.options.getUser("user", false)) !== null && _a !== void 0 ? _a : interaction.user;
            const fields = [];
            for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
                const balance = yield Main_1.currencySystem.balance(Main_1.config.get().currencies[i], user.id);
                fields.push(Embeds_1.Embeds.entry(Main_1.config.get().currencies[i], balance));
            }
            return interaction.reply({ "embeds": [Embeds_1.Embeds.balance(fields, user)] }).then();
        });
    }
}
exports.BalanceCommand = BalanceCommand;
