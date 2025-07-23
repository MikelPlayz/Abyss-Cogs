"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpawnHandler = void 0;
const Main_1 = require("../Main");
class SpawnHandler {
    constructor() {
        Main_1.minecraftBot.internal.once("spawn", () => {
            if (Main_1.config.get().events.connect.enable) {
                for (let message of Main_1.config.get().events.connect.messages) {
                    setTimeout(() => { Main_1.minecraftBot.chat(message.text); }, message.delay);
                }
                for (let action of Main_1.config.get().events.connect.actions) {
                    setTimeout(() => {
                        Main_1.minecraftBot.internal.setControlState(action.type, true);
                        setTimeout(() => { Main_1.minecraftBot.internal.setControlState(action.type, false); }, 1000);
                    }, action.delay);
                }
            }
        });
    }
}
exports.SpawnHandler = SpawnHandler;
