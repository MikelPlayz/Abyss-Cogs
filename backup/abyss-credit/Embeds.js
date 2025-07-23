"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Embeds = void 0;
const Main_1 = require("./Main");
const Util_1 = require("./Util");
class Embeds {
    static template(title, fields, color, user) {
        return { "title": title, "color": color, "fields": fields, "footer": { "text": `User: ${user.username}` }, "thumbnail": { "url": user.displayAvatarURL() } };
    }
    static level(user, xp, totalXp, level) {
        return this.template("Level " + level, [{ "name": "Progress", "value": `\`${xp}/${totalXp}\`\n\`${Util_1.Util.createProgressBar(xp, totalXp, 15)}\``, "inline": true }], this.neutral, user);
    }
    static levelUp(user, level, rewards) {
        return this.template("Level Up", [{ "name": "Info", "value": `Congratulations on leveling up to **level ${level}**!\n${Util_1.Util.formatRewards(rewards)}!`, "inline": false }], this.neutral, user);
    }
    static added(fields, user, reason) {
        return this.template("Added", [...fields, { "name": "Reason", "value": reason, "inline": false }], this.neutral, user);
    }
    static removed(fields, user, reason) {
        return this.template("Removed", [...fields, { "name": "Reason", "value": reason, "inline": false }], this.neutral, user);
    }
    static balance(fields, user) {
        return this.template("Balance", fields, this.neutral, user);
    }
    static daily(fields, user) {
        return this.template("Daily Rewards", fields, this.neutral, user);
    }
    static currency(currency, amount, symbol) {
        let fields = [];
        if (currency === "all") {
            for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
                fields.push(this.entry(Main_1.config.get().currencies[i], amount, symbol));
            }
        }
        else {
            fields.push(this.entry(currency, amount));
        }
        return fields;
    }
    static entry(currency, amount, symbol = "") {
        return { "name": Util_1.Util.capitalize(currency), "value": `[${symbol}${amount.toString()}](https://localhost)`, "inline": true };
    }
}
exports.Embeds = Embeds;
Embeds.green = 2817792;
Embeds.red = 16711680;
Embeds.neutral = 7803166;
