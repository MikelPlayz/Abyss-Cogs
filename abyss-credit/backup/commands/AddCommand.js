"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
const Util_1 = require("../Util");
class AddCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, {
            ...options,
            "name": "balanceAdd",
            // @ts-ignore
            "preconditions": ["IsCreditor", "IsValidChannel"],
            "description": "Adds to the balance of the designated user."
        });
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option => Util_1.Util.addCurrencyChoices(option).setName("currency").setDescription("The type of currency to add.").setRequired(true))
                .addIntegerOption(option => option.setName("amount").setDescription("The amount of currency to add.").setRequired(true).setMinValue(1))
                .addUserOption(option => option.setName("user").setDescription("The user to add currency to.").setRequired(true))
                .addStringOption(option => option.setName("reason").setDescription("The reason for adding currency.").setRequired(true).setMinLength(1));
        }, { "idHints": ["1093782220554129408"] });
    }
    async chatInputRun(interaction, context) {
        await interaction.deferReply();
        const currency = interaction.options.getString("currency", true);
        const amount = interaction.options.getInteger("amount", true);
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        await Main_1.currencySystem.add(currency, interaction.user.id, user.id, amount, reason);
        return interaction.editReply({ "embeds": [Embeds_1.Embeds.added(Embeds_1.Embeds.currency(currency, amount, "+"), currency, amount, user, reason)] }).then();
    }
}
exports.AddCommand = AddCommand;
