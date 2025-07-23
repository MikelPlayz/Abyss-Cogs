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
exports.DailyCommand = void 0;

const framework_1 = require("@sapphire/framework");
const Embeds_1 = require("../Embeds");
const Main_1 = require("../Main");

class DailyCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: "daily",
            preconditions: ["IsValidChannel"],
            cooldownDelay: 86400000, // 24-hour cooldown
            description: "Rewards up to three credits and gold every day."
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand(
            builder => builder.setName(this.name).setDescription(this.description),
            { idHints: ["1225881898577035306"] }
        );
    }

    chatInputRun(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = [];
            for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
                const amount = Math.floor(Math.random() * 3) + 1;
                yield Main_1.currencySystem.add(Main_1.config.get().currencies[i], "Daily", interaction.user.id, amount, "Daily");
                fields.push(Embeds_1.Embeds.entry(Main_1.config.get().currencies[i], amount, "+"));
            }

            return interaction.reply({
                embeds: [Embeds_1.Embeds.daily(fields, interaction.user)]
            });
        });
    }
}

exports.DailyCommand = DailyCommand;
