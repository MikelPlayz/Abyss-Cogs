const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');

// Load config
const config = require('./config.json');

// Required config fields
const { token, clientId, guildId } = config;

const commands = [];

// Load command definitions
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command && command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Refreshing slash commands for ${clientId}`);

    if (guildId) {
      // For testing servers — faster updates
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Registered commands in guild ${guildId}`);
    } else {
      // For global commands — slower to propagate
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('Registered global commands');
    }

  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
