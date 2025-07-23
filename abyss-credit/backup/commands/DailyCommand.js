"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class DailyCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, {
            ...options,
            "name": "daily",
            // @ts-ignore
            "preconditions": ["IsValidChannel"],
            "cooldownDelay": 86400000,
            "description": "Rewards up to three credits and gold every day."
        });
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder
                .setName(this.name)
                .setDescription(this.description);
        }, { "idHints": ["1093782138891014205"] });
    }
    async chatInputRun(interaction, context) {
        await interaction.deferReply();
        const fields = [];
        for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
            const amount = Math.floor(Math.random() * 3) + 1;
            await Main_1.currencySystem.add(Main_1.config.get().currencies[i], "Daily", interaction.user.id, amount, "Daily");
            fields.push(Embeds_1.Embeds.entry(Main_1.config.get().currencies[i], amount, "+"));
        }
        return interaction.editReply({ "embeds": [Embeds_1.Embeds.daily(fields, interaction.user)] }).then();
    }
}
exports.DailyCommand = DailyCommand;
