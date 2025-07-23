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
exports.CorrectChannel = void 0;
const framework_1 = require("@sapphire/framework");
const Main_1 = require("../Main");
class CorrectChannel extends framework_1.Precondition {
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.isEnabled(interaction.channelId);
        });
    }
    isEnabled(channelID) {
        return __awaiter(this, void 0, void 0, function* () {
            return Main_1.config.get().discord.chatChannelID === channelID
                ? this.ok()
                : this.error({
                    "context": { "silent": true }
                });
        });
    }
}
exports.CorrectChannel = CorrectChannel;
