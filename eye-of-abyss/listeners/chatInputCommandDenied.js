"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInputCommandDenied = void 0;
const framework_1 = require("@sapphire/framework");
class ChatInputCommandDenied extends framework_1.Listener {
    run(error, { interaction }) {
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply({ "content": error.message });
        }
        return interaction.reply({ "content": error.message, "ephemeral": true });
    }
}
exports.ChatInputCommandDenied = ChatInputCommandDenied;
