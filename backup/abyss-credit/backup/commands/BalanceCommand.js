"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class BalanceCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, {
            ...options,
            "name": "balance",
            // @ts-ignore
            "preconditions": ["IsValidChannel"],
            "description": "Returns the balance of the designated user."
        });
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption(option => option.setName("user").setDescription("The user to check the balance of.").setRequired(false));
        });
    }
    async chatInputRun(interaction, context) {
        let user = interaction.options.getUser("user", false);
        if (!user) {
            user = interaction.user;
        }
        const fields = [];
        for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
            const balance = await Main_1.currencySystem.balance(Main_1.config.get().currencies[i], user.id);
            fields.push(Embeds_1.Embeds.entry(Main_1.config.get().currencies[i], balance));
        }
        return interaction.reply({ "embeds": [Embeds_1.Embeds.balance(fields, user)] });
    }
}
exports.BalanceCommand = BalanceCommand;
