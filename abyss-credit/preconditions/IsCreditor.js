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
exports.IsCreditor = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
class IsCreditor extends framework_1.Precondition {
    messageRun(_message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.error({ "message": "This precondition is not supported." });
        });
    }
    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return this.hasCreditorRole((_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles);
        });
    }
    contextMenuRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return this.hasCreditorRole((_a = interaction.member) === null || _a === void 0 ? void 0 : _a.roles);
        });
    }
    hasCreditorRole(roles) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = "You need the creditor role to assign currencies.";
            if (!roles || !(roles instanceof discord_js_1.GuildMemberRoleManager)) {
                return this.error({ "message": message });
            }
            return roles.member.roles.cache.some(role => role.name === "Creditor") ? this.ok() : this.error({ "message": message });
        });
    }
}
exports.IsCreditor = IsCreditor;
exports.default = undefined;
