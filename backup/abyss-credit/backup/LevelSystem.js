"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelSystem = void 0;
const Config_1 = require("./Config");
const Embeds_1 = require("./Embeds");
const Main_1 = require("./Main");
const Util_1 = require("./Util");
class LevelSystem {
    users;
    constructor() {
        this.users = new Config_1.Config("levels.json");
    }
    findXp(id) {
        const xp = this.users.get()[id];
        if (xp) {
            return xp;
        }
        return 0;
    }
    findTotalXp(id) {
        return Math.ceil(330 * Math.log10(Util_1.Util.factorial(this.findLevel(id) + 2)));
    }
    findLevel(id) {
        const xp = this.findXp(id);
        for (let level = 100; level >= 40; level--) {
			if (xp >= Math.ceil(40000 * Math.pow(4, level - 41))) {
				return level;
			}
		}
	    for (let level = 40; level >= 0; level--) {
            if (xp >= Math.ceil(330 * Math.log10(Util_1.Util.factorial(level + 1)))) {
                return level;
            }
        }
        return 0;
    }
    persistXp(id, amount) {
        const previousLevel = this.findLevel(id);
        if (!this.users.get()[id]) {
            this.users.get()[id] = amount;
        }
        this.users.get()[id] += amount;
        this.users.save();
        const newLevel = this.findLevel(id);
        if (previousLevel === newLevel - 1) {
            this.levelUp(id, newLevel);
        }
    }
    levelUp(id, level) {
        const rewards = Main_1.config.get().leveling.rewards;
        const user = Main_1.discordClient.users.cache.get(id);
        for (let i = 0; i < rewards.length; i++) {
            Main_1.currencySystem.add(rewards[i].currency, "Level Up", id, rewards[i].amount, "Level Up").then();
        }
        Main_1.discordClient.sendEmbed(Main_1.config.get().leveling.channel, Embeds_1.Embeds.levelUp(user, level, rewards)).then();
    }
}
exports.LevelSystem = LevelSystem;
