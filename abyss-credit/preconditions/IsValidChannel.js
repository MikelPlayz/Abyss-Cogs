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
exports.IsValidChannel = void 0;
const framework_1 = require("@sapphire/framework");
const Main_1 = require("../Main");
class IsValidChannel extends framework_1.Precondition {
    messageRun(_message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.error({ "message": "This precondition is not supported." });
        });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.isValidChannel(interaction.channelId);
        });
    }
    contextMenuRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.isValidChannel(interaction.channelId);
        });
    }
    isValidChannel(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Main_1.config.get().channels.includes(channelId) ? this.ok() : this.error({ "message": "You cannot use that command in this channel." });
        });
    }
}
exports.IsValidChannel = IsValidChannel;
exports.default = undefined;
