require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AuditLogEvent,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// MEMBER JOIN
client.on('guildMemberAdd', member => {
  const channel = member.guild.channels.cache.get(process.env.JOIN_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${member.user.username} has joined the guild!`)
    .addFields(
      { name: 'Username', value: member.user.username, inline: true },
      { name: 'IGN', value: member.displayName, inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0xff0000) // Red
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

// MEMBER LEAVE / KICK / BAN
client.on('guildMemberRemove', async member => {
  const channel = member.guild.channels.cache.get(process.env.LEAVE_CHANNEL_ID);
  if (!channel) return;

  let actionTaken = "left the guild";
  let executor = null;

  try {
    // Check for recent kick
    const kickLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberKick,
    });

    const kickEntry = kickLogs.entries.find(entry => entry.target.id === member.id);

    if (kickEntry && (Date.now() - kickEntry.createdTimestamp) < 5000) {
      actionTaken = "was **kicked**";
      executor = kickEntry.executor;
    } else {
      // Check for recent ban
      const banLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
      });

      const banEntry = banLogs.entries.find(entry => entry.target.id === member.id);

      if (banEntry && (Date.now() - banEntry.createdTimestamp) < 5000) {
        actionTaken = "was **banned**";
        executor = banEntry.executor;
      }
    }
  } catch (err) {
    console.error("Error fetching audit logs:", err);
  }

  const embed = new EmbedBuilder()
    .setTitle(`👋 ${member.user.username} ${actionTaken}`)
    .addFields(
      { name: 'Username', value: member.user.username, inline: true },
      { name: 'IGN', value: member.displayName, inline: true },
      ...(executor ? [{ name: 'By', value: executor.tag, inline: false }] : [])
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(0xff0000) // Red
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

client.login(process.env.DISCORD_TOKEN);

