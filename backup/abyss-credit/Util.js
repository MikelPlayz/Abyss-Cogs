"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
const Main_1 = require("./Main");
class Util {
    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static factorial(number) {
        var result = number;
        if (number === 0 || number === 1) {
            return 1;
        }
        while (number > 1) {
            number--;
            result = result * number;
        }
        return result;
    }
    static addCurrencyChoices(option) {
        for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
            option.addChoices({ "name": Main_1.config.get().currencies[i], "value": Main_1.config.get().currencies[i] });
        }
        return option.addChoices({ "name": "all", "value": "all" });
    }
    static createProgressBar(value, maxValue, size) {
        const percentage = Math.min(value / maxValue, 1);
        const progress = Math.max(0, Math.round(size * percentage));
        const emptyProgress = Math.max(0, size - progress);
        const progressText = "▇".repeat(progress);
        const emptyProgressText = "—".repeat(emptyProgress);
        const percentageText = Math.round(percentage * 100) + "%";
        return "`[" + progressText + emptyProgressText + "]" + percentageText + "`";
    }
    static formatRewards(rewards) {
        let rewardsFormatted = "You have earned ";
        if (rewards.length === 1) {
            rewardsFormatted += `${rewards[0].amount} ${rewards[0].currency}`;
        }
        else {
            for (let i = 0; i < rewards.length - 1; i++) {
                rewardsFormatted += `${rewards[i].amount} ${rewards[i].currency}, `;
            }
            rewardsFormatted += `and ${rewards[rewards.length - 1].amount} ${rewards[rewards.length - 1].currency}`;
        }
        return rewardsFormatted;
    }
}
exports.Util = Util;
