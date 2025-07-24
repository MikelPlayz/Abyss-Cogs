"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const clientId = "1360784413469704262";
const guildId = "866073594610057216";
const token = "MTM1OTYyMDc1Mjc5NzczMzA0Ng.GDktmf.5072V4Bbea-1i-I_fYc7BN7G-Bes2pQ4lKl4bc";
const rest = new discord_js_1.REST().setToken(token);
rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: [] })
    .then(() => console.log("Successfully deleted all application commands."))
    .catch(console.error);
rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body: [] })
    .then(() => console.log("Successfully deleted all guild commands."))
    .catch(console.error);