"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordBot_1 = require("./DiscordBot");
const MemberLeaveListener_1 = require("./listeners/MemberLeaveListener");
let discordBot = new DiscordBot_1.DiscordBot();
discordBot.registerListener(new MemberLeaveListener_1.MemberLeaveListener(discordBot));
discordBot.start();
