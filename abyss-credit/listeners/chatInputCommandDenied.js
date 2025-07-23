"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInputCommandDenied = void 0;
const framework_1 = require("@sapphire/framework");
const time_utilities_1 = require("@sapphire/time-utilities");
class ChatInputCommandDenied extends framework_1.Listener {
    run(error, { interaction }) {
        let message = error.message;
        if (error.identifier === framework_1.Identifiers.PreconditionCooldown) {
            const remaining = new time_utilities_1.DurationFormatter().format(Reflect.get(Object(error.context), "remaining"));
            message = `This command is still on a cooldown! Try again in ${remaining}.`;
        }
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply({ "content": message });
        }
        return interaction.reply({ "content": message, "ephemeral": true });
    }
}
exports.ChatInputCommandDenied = ChatInputCommandDenied;
