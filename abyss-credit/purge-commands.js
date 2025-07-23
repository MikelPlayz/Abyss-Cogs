const { REST, Routes } = require('discord.js');

// === 🔧 CONFIG HERE ===
const TOKEN = "MTM2MDQxNjk3MzE1NDE1Njc1NA.GyVNAV.tKH_CmpOjh6eNTNObNiTKaPDui7CtUDtRNHuDw";
const CLIENT_ID = "1360416973154156754";    // From Discord Dev Portal
const GUILD_ID = "866073594610057216";         // Right-click server > Copy ID
// ======================

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔥 Purging GUILD commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );
    console.log("✅ GUILD commands purged.");

    console.log("🔥 Purging GLOBAL commands...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );
    console.log("✅ GLOBAL commands purged.");
  } catch (err) {
    console.error("❌ Error purging commands:", err);
  }
})();
