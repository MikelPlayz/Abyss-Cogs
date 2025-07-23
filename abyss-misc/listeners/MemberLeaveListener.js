"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberLeaveListener = void 0;
const framework_1 = require("@sapphire/framework");
const Main_1 = require("../Main");
class MemberLeaveListener extends framework_1.Listener {
    constructor(context, options) {
        super(context, Object.assign(Object.assign({}, options), { "once": false, "emitter": "ws", "event": "GUILD_MEMBER_REMOVE" }));
    }
    run(member) {
        var _a;
        const embed = {
            "title": `${member.user.username} has left the guild!`,
            "color": 16711680,
            "fields": [{ "name": "Username", "value": member.user.username, "inline": true }],
            "thumbnail": { "url": `${member.user.avatarURL()}` }
        };
        if (member.nickname) {
            (_a = embed.fields) === null || _a === void 0 ? void 0 : _a.push({ "name": "IGN", "value": member.nickname, "inline": true });
        }
        Main_1.discordBot.sendEmbed(embed).then();
    }
}
exports.MemberLeaveListener = MemberLeaveListener;
