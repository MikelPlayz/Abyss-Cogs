"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const clientId = "912580921029447740";
const guildId = "866073594610057216";
const token = "OTEyNTgwOTIxMDI5NDQ3NzQw.G556xv.8WuYQ9KGRZiD0CLg39qkAJxdFEzgJ8333fCKMY";
const rest = new discord_js_1.REST().setToken(token);
rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: [] })
    .then(() => console.log("Successfully deleted all application commands."))
    .catch(console.error);
rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body: [] })
    .then(() => console.log("Successfully deleted all guild commands."))
    .catch(console.error);
