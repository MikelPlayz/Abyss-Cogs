"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelCommand = void 0;
const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");
class LevelCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, {
            ...options,
            "name": "level",
            // @ts-ignore
            "preconditions": ["IsValidChannel"],
            "description": "Returns the level of the designated user."
        });
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(builder => {
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption(option => option.setName("user").setDescription("The user to check the level of.").setRequired(false));
        }, { "idHints": ["1103812055074623518"] });
    }
    async chatInputRun(interaction, context) {
        await interaction.deferReply();
        let user = interaction.options.getUser("user", false);
        if (!user) {
            user = interaction.user;
        }
        return interaction.editReply({ "embeds": [Embeds_1.Embeds.level(user, Main_1.levelSystem.findXp(user.id), Main_1.levelSystem.findTotalXp(user.id), Main_1.levelSystem.findLevel(user.id))] }).then();
    }
}
exports.LevelCommand = LevelCommand;
