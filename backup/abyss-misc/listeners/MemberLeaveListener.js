"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberLeaveListener = void 0;
const discord_akairo_1 = require("discord-akairo");
const discord_js_1 = require("discord.js");
const Timestamp_1 = require("../Timestamp");
class MemberLeaveListener extends discord_akairo_1.Listener {
    constructor(discordBot) {
        super("guildMemberRemove", {
            "emitter": "client",
            "event": "guildMemberRemove"
        });
        this.discordBot = discordBot;
    }
    exec(member) {
        const embed = new discord_js_1.MessageEmbed()
            .setTitle(`${member.user.username} has left the guild!`)
            .setColor("FF0000")
            .addField("Username", `${member.user.username}#${member.user.discriminator}`, true)
            .setFooter(`${Timestamp_1.Timestamp.now()}`)
            .setThumbnail(`${member.user.avatarURL()}`);
        if (member.nickname) {
            embed.addField("IGN", `${member.nickname}`, true);
        }
        this.discordBot.sendEmbed(embed).then();
    }
}
exports.MemberLeaveListener = MemberLeaveListener;
