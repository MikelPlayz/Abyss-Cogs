"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHandler = void 0;
const Files_1 = require("../Files");
const Filter_1 = require("../Filter");
const Main_1 = require("../Main");
class ChatHandler {
    constructor() {
        Main_1.minecraftBot.internal.on("messagestr", (message) => {
            const formattedMessage = message.replace(/@/g, "");
            this.checkLogging(formattedMessage);
            this.checkFilter(formattedMessage);
        });
    }
    checkLogging(message) {
        if (!Files_1.Files.exists(Main_1.config.get().logging.path)) {
            return;
        }
        if (Main_1.config.get().logging.enable) {
            Files_1.Files.write(Main_1.config.get().logging.path, `${message}\n`);
        }
    }
    checkFilter(message) {
        if (!Main_1.config.get().filter.enable || Filter_1.Filter.complies(Main_1.config.get().filter.list, message)) {
            Main_1.discordBot.send(`${message}`);
        }
    }
}
exports.ChatHandler = ChatHandler;
