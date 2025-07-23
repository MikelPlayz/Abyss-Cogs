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
exports.RemoveCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
const Util_1 = require("../Util");
class RemoveCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "name": "remove", "preconditions": ["IsCreditor", "IsValidChannel"], "description": "Removes from the balance of the designated user." }));
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder.setName(this.name).setDescription(this.description)
                .addStringOption(option => Util_1.Util.addCurrencyChoices(option).setName("currency").setDescription("The type of currency to remove.").setRequired(true))
                .addIntegerOption(option => option.setName("amount").setDescription("The amount of currency to remove.").setRequired(true).setMinValue(1))
                .addUserOption(option => option.setName("user").setDescription("The user to remove currency from.").setRequired(true))
                .addStringOption(option => option.setName("reason").setDescription("The reason for removing currency.").setRequired(true));
        }, { "idHints": ["1225881894651035728"] });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const currency = interaction.options.getString("currency", true);
            const amount = interaction.options.getInteger("amount", true);
            const user = interaction.options.getUser("user", true);
            const reason = interaction.options.getString("reason", true);
            yield Main_1.currencySystem.remove(currency, interaction.user.id, user.id, amount, reason);
            return interaction.reply({ "embeds": [Embeds_1.Embeds.removed(Embeds_1.Embeds.currency(currency, amount, "-"), user, reason)] }).then();
        });
    }
}
exports.RemoveCommand = RemoveCommand;
