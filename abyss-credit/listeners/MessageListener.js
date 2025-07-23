"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageListener = void 0;
const framework_1 = require("@sapphire/framework");
const Main_1 = require("../Main");
const Util_1 = require("../Util");
class MessageListener extends framework_1.Listener {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { event: "messageCreate" }));
        this.periods = new Map();
    }
    run(message) {
        if (message.author.bot) {
            return;
        }
        const id = message.author.id;
        const xp = this.periods.get(id);
        let add = Util_1.Util.random(Main_1.config.get().leveling.xp[0], Main_1.config.get().leveling.xp[1]);
        if (!xp || !xp.started) {
            this.startPeriod(id, add);
            return;
        }
        if (xp.earned >= 10) {
            return;
        }
        if (xp.earned + add > 10) {
            add = 10 - xp.earned;
        }
        this.periods.set(id, { earned: xp.earned + add, started: xp.started });
        Main_1.levelSystem.persistXp(id, add);
    }
    startPeriod(id, add) {
        this.periods.set(id, { earned: add, started: true });
        Main_1.levelSystem.persistXp(id, add);
        setTimeout(() => { this.periods.set(id, { earned: 0, started: false }); }, Main_1.config.get().leveling.period);
    }
}
exports.MessageListener = MessageListener;
